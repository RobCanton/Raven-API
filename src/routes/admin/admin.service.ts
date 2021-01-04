import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { AlertService, Alert } from '../../helpers/alert.service';
import { NewsTopic } from './admin.model';

@Injectable()
export class AdminService {

  constructor(
    private readonly redisService: RedisService,
    private readonly firebaseService: FirebaseService,
    private readonly alertService: AlertService
  ) { }

  reset() {
    this.redisService.flushall();
  }

  async userNotify(uid: string, title: string, body: string) {

    const token = await this.redisService.hget('pushtokens', uid) as string;

    if (token) {
      await this.firebaseService.sendNotification(token, title, body);
      return {
        success: true,
        status: 'sent'
      }
    } else {
      return {
        success: false,
        status: 'failed'
      }
    }
  }

  async triggerAlert(alertID: string, price: number, timestamp: number) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    let alert:Alert = JSON.parse(alertStr) as Alert;
    //console.log("TRIGGER ALERT: %j", alert);
    await this.firebaseService.writeAlert(alertID, alert, price, timestamp);

    let payload = this.alertService.notificationPayload(alert.s, alert.t, alert.c, alert.v, price);
    await this.userNotify(alert.u, payload.title, payload.body);

    let resetTime = this.alertService.resetTime(alert.r);
    if (resetTime) {
      await this.redisService.zadd(`fired_alerts`, resetTime, alertID);
    }
    return alert;

  }

  async getAlertsForSymbol(symbol: string) {
    let priceOverAlerts = await this.redisService.zrange(`alerts_price_over:${symbol}`, 0, -1) as Array<string>;
    var response = [];
    priceOverAlerts.forEach( str => {
      response.push(JSON.parse(str));
    })
    return response;
  }

  async getNewsTopics() {
    let topics = await this.redisService.lrange('news_topics', 0 , -1) as Array<string>;
    return topics;
  }

  async setNewsTopics(topics: NewsTopic[]) {
    console.log(`Topics: ${topics}`);

    var topicQueries = [];

    for (var i=0; i<topics.length; i++) {
      var query = "";
      let topic = topics[i];
      for (var j=0; j<topic.queryItems.length; j++) {
        let item = topic.queryItems[j];
        if (j == 0) {
          query += `${item.key}=${item.value}`;
        } else {
          query += `&${item.key}=${item.value}`;
        }
      }
      topicQueries.push(`${topic.name}:${query}`);
    }

    await this.redisService.del(`news_topics`);
    await this.redisService.rpushMultiple(`news_topics`, topicQueries);
    return topicQueries;
  }

  async getWatcherStatus() {
    let watchlist = await this.redisService.smembers("stocks_watchlist") as string[];
    var watchersPromises = [];
    watchlist.forEach( symbol => {
      let promise = this.redisService.hgetall(`stocks_watchers:${symbol}`);
      watchersPromises.push(promise);
    })

    let watchers = await Promise.all(watchersPromises);
    var response = [];

    for (var i=0; i<watchlist.length;i++) {
      response.push({
        symbol: watchlist[i],
        watchers: watchers[i]
      })
    }

    return {
      "stocks": response
    };
  }
}
