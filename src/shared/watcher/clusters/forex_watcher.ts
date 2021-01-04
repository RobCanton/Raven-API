import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { FirebaseService } from '../../firebase/firebase.service';
import { MarketService } from '../../market/market.service';
import { RedisService } from '../../redis/redis.service';
import { Watcher } from './watcher';
import { WatcherDelegate } from '../watcher.service';
import { Message, ForexQuoteMessage, ForexAggregateMessage } from '../watcher.model';
import { ForexConsumer } from '../consumers/forex_consumer';

export class ForexWatcher extends Watcher {
  private consumer:ForexConsumer;

  constructor(
    delegate: WatcherDelegate,
    apiKey: string,
    firebaseService: FirebaseService,
    marketService:MarketService,
    redisService: RedisService) {
    super(MarketType.forex, delegate, apiKey, marketService, redisService);
    this.consumer = new ForexConsumer(firebaseService, redisService);
  }

  nextTick() {
    this.consumer.nextTick();
  }

  handleMessage(msg: Message) {
    if (msg == undefined || msg == null) {
      return;
    }
    //console.log("msg: %j", msg);
    switch (msg.ev) {
      case "C":
      let quote = msg as ForexQuoteMessage;
      this.delegate.sendMessage(msg.ev, quote.p, quote);
      this.consumer.consumerQuote(quote);
      break;
      case "CA":
      let aggregate = msg as ForexAggregateMessage;
      this.delegate.sendMessage(msg.ev, aggregate.pair, aggregate);
      //console.log(`gucci`);
      break;
      default:
      break;
    }
  }

  async subscribeTo(symbol: string) {
    let socketSymbol = await this.marketService.socketSymbol(symbol);
    this.sendWebsocketMessage(`{"action":"subscribe","params":"C.${socketSymbol},CA.${socketSymbol}"}`);
  }

  async unsubscribeFrom(symbol: string) {
    let socketSymbol = await this.marketService.socketSymbol(symbol);
    try {
      let results = await this.redisService.hgetall(`${this.marketType}_watchers:${symbol}`) as string[];
      if (results) {
        this.logger.log(`Remain subscribed to ${symbol}: other watchers`);
        return;
      } else {
        this.logger.log(`Unsubscribe from ${symbol}`);
        this.sendWebsocketMessage(`{"action":"unsubscribe","params":"C.${socketSymbol},CA.${socketSymbol}"}`);
        await this.redisService.srem(`${this.marketType}_watchlist`, symbol);
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }


}
