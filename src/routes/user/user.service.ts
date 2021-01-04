import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { PolygonService } from '../../shared/polygon/polygon.service';
import { StockService } from '../../helpers/stock.service';
import { AlertService } from '../../helpers/alert.service';
import { MarketType } from '../../shared/market/market.model';
import { MarketService } from '../../shared/market/market.service';
import { WatcherService } from '../../shared/watcher/watcher.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { UserAccount } from './user.model';
import { v4 as uuid } from 'uuid';
import * as short from 'short-uuid';

export interface MarketStatus {
  market: string
}

@Injectable()
export class UserService {

  constructor(
    private readonly stockService: StockService,
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly alertService: AlertService,
    private readonly watcherService: WatcherService,
    private readonly marketService: MarketService,
    private readonly firebaseService: FirebaseService
  ) {}

  async account(uid: string):Promise<UserAccount> {

    let firestore = this.firebaseService.firestore();
    let accountRef = firestore.collection('accounts').doc(uid);
    let accountSnapshot = await accountRef.get();
    let accountDoc = accountSnapshot.data() as UserAccount;

    if (accountDoc == undefined) {
      let newAccount = {
        premium: false
      }

      await accountRef.set(newAccount);

      return newAccount;
    }
    return accountDoc;
  }

  async watchlist(uid: string) {
    let watchlist = await this.redisService.lrange(`user_watchlist:${uid}`, 0 , -1) as string[];
    var promises = [];

    let alerts = await this.getAlerts(uid);

    let marketStatus = await this.redisService.get('market-status') as string;

    let newsTopicStrs = await this.redisService.lrange('news_topics', 0 , -1) as Array<string>;
    var newsTopics = [];
    newsTopicStrs.forEach( topic => {
      let split = topic.split(':');
      newsTopics.push({
        name: split[0],
        query: split[1]
      })
    })

    let mostActiveStocks = await this.redisService.lrange('list:mostactivestocks', 0, -1) as string[];

    let stocklist = [...new Set([...watchlist ,...mostActiveStocks])];

    var snapshotPromises = [];

    console.log(`stocklist: ${stocklist}`);
    stocklist.forEach( symbol => {
      let snapshotPromise = this.marketService.snapshot(symbol);
      snapshotPromises.push(snapshotPromise);
    })

    let snapshots = await Promise.all(snapshotPromises);

    var snapshotsDict = {};
    snapshotsDict = {}
    snapshotsDict[MarketType.stocks] = {}
    snapshotsDict[MarketType.forex] = {}
    snapshotsDict[MarketType.crypto] = {}

    snapshots.forEach( snapshot => {
      snapshotsDict[snapshot.marketType][snapshot.symbol] = snapshot;
    })

    return {
      marketStatus: marketStatus,
      alerts: alerts,
      news: {
        topics: newsTopics
      },
      lists: {
        watchlist: watchlist,
        mostActiveStocks: mostActiveStocks,
      },
      snapshots: snapshotsDict
    };
  }

  async patchWatchlist(uid:string, symbols: string[]) {
    await this.redisService.del(`user_watchlist:${uid}`);
    await this.redisService.rpushMultiple(`user_watchlist:${uid}`, symbols);
    return true;
  }

  async subscribe(uid: string, symbol:string) {

    let marketType = this.marketService.typeForSymbol(symbol);
    await this.redisService.hset(`${marketType}_watchers:${symbol}`, uid, true);
    await this.redisService.rpush(`user_watchlist:${uid}`, symbol);
    await this.redisService.sadd(`${marketType}_watchlist`, symbol);

    await this.watcherService.subscribeTo(symbol, marketType);

    let snapshot = await this.marketService.snapshot(symbol);

    return snapshot;

  }

  async unsubscribe(uid: string, symbol:string) {
    // Remove user from watchers & symbol from user watchlist
    let marketType = this.marketService.typeForSymbol(symbol);

    await this.redisService.hdel(`${marketType}_watchers:${symbol}`, uid);
    await this.redisService.lrem(`user_watchlist:${uid}`, 0, symbol);

    await this.watcherService.unsubscribeFrom(symbol, marketType);

    return {
      unsubscribed: true
    }

  }

  async getPushToken(uid: string) {
    let response = await this.redisService.hget('pushtokens', uid);
    return response;

  }


  async registerPushToken(uid: string, token: string) {
    await this.redisService.hset('pushtokens', uid, token);

    return {
      success: true
    }

  }

  async stockSnapshot(symbol: string) {
    let response = await this.stockService.snapshot(symbol);
    return response;
  }

  async getAlerts(uid: string) {
    let alertIDs = await this.redisService.smembers(`user_alerts:${uid}`) as Array<string>;
    var promises = [];
    var response = [];
    alertIDs.forEach( id => {
      promises.push(this.redisService.get(`alerts:${id}`));
    })
    let alertStrs = await Promise.all(promises);
    for (var i = 0; i < alertStrs.length; i++) {

      let alert = JSON.parse(alertStrs[i]);
      if (alert.u === uid) {
        let alertObj = {
          id: alertIDs[i],
          condition: Math.floor(alert.c),
          symbol: alert.s,
          type: Math.floor(alert.t),
          value: Number(alert.v),
          timestamp: Number(alert.d),
          reset: Math.floor(alert.r),
          enabled: alert.e
        }
        response.push(alertObj);
      }

    }

    return response;
  }

  async createAlert(
    uid:string,
    symbol: string,
    type: number,
    condition: number,
    value: number,
    reset: number) {

    let t = Math.floor(Number(type));
    let c = Math.floor(Number(condition));
    let v = Number(value);
    let r = Math.floor(reset);

    let alertID = short.generate();

    let socketSymbol = await this.marketService.socketSymbol(symbol);
    let marketType:MarketType = this.marketService.typeForSymbol(symbol);

    let timestamp = Date.now();

    let alert = {
      s: symbol,
      ss: socketSymbol,
      t: t, // type
      c: c, // condition
      v: v, // value
      d: timestamp, // dateCreated
      u: uid, // userID,
      e: 1, // enabled,
      r: r
    }

    console.log("Create %s alert: %j", marketType, alert);

    let alertStr = JSON.stringify(alert);

    let alertSuffix = this.alertService.alertSuffix(t, c);

    if (!alertSuffix) {
      return {
        success: false
      }
    }

    await this.redisService.zadd(`alerts_${marketType}_${alertSuffix}:${socketSymbol}`, v, alertID);
    await this.redisService.set(`alerts:${alertID}`, alertStr);
    await this.redisService.sadd(`user_alerts:${uid}`, alertID);

    return {
      id: alertID,
      type: t,
      condition: c,
      value: v,
      symbol: symbol,
      timestamp: timestamp,
      reset: r,
      enabled: 1
    }

  }

  async patchAlert(uid: string, alertID:string, type: number, condition: number, value: number, reset: number, enabled: number) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    var alert = JSON.parse(alertStr);

    let marketType:MarketType = this.marketService.typeForSymbol(alert.s);

    let alertSuffix = this.alertService.alertSuffix(alert.t, alert.c);
    if (alertSuffix) {
      await this.redisService.zrem(`alerts_${marketType}_${alertSuffix}:${alert.ss}`, alertID);
      await this.redisService.zrem(`fired_alerts`, alertID);
    }

    if (type) {
      alert.t = Math.floor(type);
    }

    if (condition) {
      alert.c = Math.floor(condition);
    }

    if (value) {
      alert.v = value;
    }

    if (reset) {
      alert.r = Math.floor(reset);
    }

    if (enabled !== undefined && enabled !== null) {
      if (enabled > 0) {
        alert.e = 1;
      } else {
        alert.e = 0;
      }
    }

    console.log("Patch alert: %j", alert);

    let patchedAlertStr = JSON.stringify(alert);

    let patchedAlertSuffix = this.alertService.alertSuffix(alert.t, alert.c);

    if (!patchedAlertSuffix) {
      return {
        success: false
      }
    }

    if (alert.e === 1) {
      await this.redisService.zadd(`alerts_${marketType}_${patchedAlertSuffix}:${alert.ss}`, alert.v, alertID);
    }
    await this.redisService.set(`alerts:${alertID}`, patchedAlertStr);

    return {
      id: alertID,
      type: Math.floor(alert.t),
      condition: Math.floor(alert.c),
      value: Number(alert.v),
      symbol: alert.s,
      timestamp: Number(alert.d),
      reset: Math.floor(alert.r),
      enabled: alert.e
    }

  }

  async deleteAlert(uid: string, alertID: string) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    let alert = JSON.parse(alertStr);

    let marketType:MarketType = this.marketService.typeForSymbol(alert.s);

    let alertSuffix = this.alertService.alertSuffix(alert.t, alert.c);

    await this.redisService.zrem(`alerts_${marketType}_${alertSuffix}:${alert.ss}`, alertID);
    await this.redisService.srem(`user_alerts:${uid}`, alertID);
    await this.redisService.del(`alerts:${alertID}`);

    return {
      alertID: alertID
    }
  }


}
