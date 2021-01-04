import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { MarketService } from '../../market/market.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { RedisService } from '../../redis/redis.service';
import { Watcher } from './watcher';
import { WatcherDelegate } from '../watcher.service';
import { Message, CryptoQuoteMessage, CryptoTradeMessage, CryptoAggregateMessage } from '../watcher.model';
import { CryptoConsumer } from '../consumers/crypto_consumer';

export class CryptoWatcher extends Watcher {

  private consumer:CryptoConsumer;

  constructor(
    delegate: WatcherDelegate,
    apiKey: string,
    firebaseService: FirebaseService,
    marketService: MarketService,
    redisService: RedisService) {

    super(MarketType.crypto, delegate, apiKey, marketService, redisService);

    this.consumer = new CryptoConsumer(firebaseService, redisService);
  }

  nextTick() {
    this.consumer.nextTick();
  }

  handleMessage(msg: Message) {
    if (msg == undefined || msg == null) {
      return;
    }

    //this.logger.log(`Message [${msg.ev}]`);
    switch (msg.ev) {
      case "XQ":
      let quote = msg as CryptoQuoteMessage;

      this.delegate.sendMessage(msg.ev, quote.pair, quote);
      break;
      case "XT":
      let trade = msg as CryptoTradeMessage;
      this.consumer.consumeTrade(trade);
      this.delegate.sendMessage(msg.ev, trade.pair, trade);
      break;
      case "XA":
      let aggregate = msg as CryptoAggregateMessage;
      this.delegate.sendMessage(msg.ev, aggregate.pair, aggregate);
      this.consumer.consumeAggregate(aggregate);
      break;
      default:
      break;
    }
  }

  async subscribeTo(symbol: string) {
    let socketSymbol = await this.marketService.socketSymbol(symbol);
    this.sendWebsocketMessage(`{"action":"subscribe","params":"XT.${socketSymbol},XQ.${socketSymbol}"}`);
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
        this.sendWebsocketMessage(`{"action":"unsubscribe","params":"XQ.${socketSymbol},XT.${socketSymbol},XA.${socketSymbol}"}`);
        await this.redisService.srem(`${this.marketType}_watchlist`, symbol);
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }


}
