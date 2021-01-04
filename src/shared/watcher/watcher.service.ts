import { Injectable, Inject, HttpService, InternalServerErrorException, Logger } from '@nestjs/common';
import { WatcherGateway } from './watcher.gateway';
import { ClientMessage, StockMessage, StockTradeMessage, StockQuoteMessage, StockAggregateMessage } from './watcher.model';
import { FirebaseService } from '../firebase/firebase.service';
import { RedisService } from '../redis/redis.service';
import { AlertService } from '../../helpers/alert.service';
import { MarketType } from '../market/market.model';
import { MarketService } from '../market/market.service';
import { Watcher } from './clusters/watcher';
import { StocksWatcher } from './clusters/stocks_watcher';
import { ForexWatcher } from './clusters/forex_watcher';
import { CryptoWatcher } from './clusters/crypto_watcher';
import { Dictionary } from '../../interfaces/common.interfaces';
import * as WebSocket from "ws";

export interface WatcherDelegate {
  sendMessage(ev: string, symbol: string, data: any): void
}

@Injectable()
export class WatcherService {

  private logger: Logger = new Logger('WatcherService');
  private watchers:Dictionary<Watcher>;

  constructor(@Inject('CONFIG_OPTIONS') private options,
    private readonly watcherGateway: WatcherGateway,
    private readonly firebaseService: FirebaseService,
    private readonly marketService: MarketService,
    private readonly redisService: RedisService,
    private readonly alertService: AlertService) {

    this.watchers = {};
    this.watchers[MarketType.stocks] = new StocksWatcher(this, this.options.api_key, firebaseService, marketService, redisService);
    this.watchers[MarketType.forex] = new ForexWatcher(this, this.options.api_key, firebaseService, marketService, redisService);
    this.watchers[MarketType.crypto] = new CryptoWatcher(this, this.options.api_key, firebaseService, marketService, redisService);

  }

  keepAlive() {
    this.watchers[MarketType.stocks].ping();
    this.watchers[MarketType.forex].ping();
    this.watchers[MarketType.crypto].ping();
  }

  nextTick() {
    this.watchers[MarketType.stocks].nextTick();
    this.watchers[MarketType.forex].nextTick();
    this.watchers[MarketType.crypto].nextTick();
  }

  private handleStockTradeMessage(message:StockTradeMessage) {
    this.watcherGateway.sendStockTradeMessage(message);
  }

  private handleStockQuoteMessage(message:StockQuoteMessage) {
    this.watcherGateway.sendStockQuoteMessage(message);
  }

  private handleStockAggregateMessage(message:StockAggregateMessage) {
    this.alertService.consumeAggregateMessage(message);
  }

  async subscribeTo(symbol: string, marketType: MarketType):Promise<void> {

    await this.watchers[marketType].subscribeTo(symbol);
    return;
  }

  async unsubscribeFrom(symbol: string, marketType: MarketType):Promise<void> {
    await this.watchers[marketType].unsubscribeFrom(symbol);
    return;
  }

  async unwatchList(listKey: string) {

    let list = await this.redisService.lrange(listKey, 0 , -1) as string[];
    console.log("list: ", list);
    var unwatchPromises = [];
    var unsubscribePromises = [];

    list.forEach( symbol => {
      let marketType = this.marketService.typeForSymbol(symbol);
      let unwatch = this.redisService.hdel(`${marketType}_watchers:${symbol}`, listKey);
      unwatchPromises.push(unwatch);

      let unsubscribe = this.unsubscribeFrom(symbol, marketType);
      unsubscribePromises.push(unsubscribe);
    })

    await Promise.all(unwatchPromises);
    await Promise.all(unsubscribePromises);
    await this.redisService.del(listKey);

  }

  sendMessage(ev: string, symbol: string, data: any) {
    let message:ClientMessage = {
      event: `${ev}.${symbol}`,
      room: symbol,
      data: data
    }

    this.watcherGateway.sendMessage(message);
  }

}
