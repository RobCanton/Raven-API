import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { FirebaseService } from '../../firebase/firebase.service';
import { MarketService } from '../../market/market.service';
import { RedisService } from '../../redis/redis.service';
import { Watcher } from './watcher';
import { WatcherDelegate } from '../watcher.service';
import { Message, StockTradeMessage, StockQuoteMessage, StockAggregateMessage } from '../watcher.model';
import { StocksConsumer } from '../consumers/stocks_consumer';

export class StocksWatcher extends Watcher {

  private consumer:StocksConsumer;

  constructor(
    delegate: WatcherDelegate,
    apiKey: string,
    firebaseService: FirebaseService,
    marketService:MarketService,
    redisService: RedisService) {

    super(MarketType.stocks, delegate, apiKey, marketService, redisService);

    this.consumer = new StocksConsumer(firebaseService, redisService);
  }

  nextTick() {

  }

  handleMessage(msg: Message) {
    if (msg == undefined || msg == null) {
      return;
    }

    //this.logger.log(`Message [${msg}]`);

    switch (msg.ev) {
      case "T":
      let trade = msg as StockTradeMessage;
      this.delegate.sendMessage(msg.ev, trade.sym, trade);
      break;
      case "Q":
      let quote = msg as StockQuoteMessage;
      this.delegate.sendMessage(msg.ev, quote.sym, quote);
      break;
      case "A":
      let aggregate = msg as StockAggregateMessage;
      this.delegate.sendMessage(msg.ev, aggregate.sym, aggregate);
      this.consumer.consumeAggregate(aggregate);
      break;
      default:
      break;
    }
  }

  async subscribeTo(symbol:string) {
    let socketSymbol = await this.marketService.socketSymbol(symbol);
    this.sendWebsocketMessage(`{"action":"subscribe","params":"Q.${socketSymbol},T.${socketSymbol},A.${socketSymbol}"}`);
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
        this.sendWebsocketMessage(`{"action":"unsubscribe","params":"Q.${socketSymbol},T.${socketSymbol},A.${socketSymbol}"}`);
        await this.redisService.srem(`${this.marketType}_watchlist`, symbol);
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }


}
