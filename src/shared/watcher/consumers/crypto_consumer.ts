import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { FirebaseService } from '../../firebase/firebase.service';
import { RedisService } from '../../redis/redis.service';
import { Consumer, AlertTriggerSet } from './consumer';
import { CryptoAggregateMessage } from '../watcher.model';
import { CryptoTradeMessage, CryptoQuoteMessage } from '../watcher.model';
import { Dictionary } from '../../../interfaces/common.interfaces';

const AlertType = {
  NONE: '0',
  PRICE: '1',
  BID: '2',
  ASK: '3'
}

const PriceCondition = {
  NONE: '0',
  IS_OVER: '1',
  IS_UNDER: '2'
}

/*
export interface CryptoAggregateMessage extends Message {
  pair: string
  o: number
  ox: number
  h: number
  hx: number
  l: number
  lx: number
  c: number
  cx: number
  v: number
  s: number
  e: number
}*/


export class CryptoConsumer extends Consumer {

  private list_price_low:Dictionary<number>;
  private list_price_high:Dictionary<number>;

  constructor(
    firebaseService: FirebaseService,
    redisService: RedisService
  ) {

    super(MarketType.crypto, firebaseService, redisService);

    this.list_price_low = {};
    this.list_price_high = {};
  }

  /*export interface CryptoTradeMessage extends Message {
    pair: string
    p: number
    t: number
    s: number
    c: number[]
    i: string
    x: number
    r: number
  }
  */


  async nextTick() {
    var multiDelete = this.redisService.multi();

    var triggerSets:AlertTriggerSet[] = [];

    for (let symbol in this.list_price_low) {
      let value = this.list_price_low[symbol];
      //this.logger.log(`Crypto tick: ${symbol} : ${value}`);

      let key = `alerts_crypto_price_over:${symbol}`;
      let alerts = await this.redisService.zrangebyscore(key, 0, value) as string[];

      alerts.forEach( alertID => {
        multiDelete.zrem(key, alertID);
        triggerSets.push({
          id: alertID,
          value: value
        });
      });
    }

    for (let symbol in this.list_price_high) {
      let value = this.list_price_high[symbol];
      // /this.logger.log(`Crypto tick: ${symbol} : ${value}`);

      let key = `alerts_crypto_price_under:${symbol}`;
      let alerts = await this.redisService.zrangebyscore(key, 0, value) as string[];

      alerts.forEach( alertID => {
        multiDelete.zrem(key, alertID);
        triggerSets.push({
          id: alertID,
          value: value
        });
      });
    }

    await multiDelete.exec();

    triggerSets.forEach( async (set) => {
      await this.triggerAlert(set.id, set.value);
    })

  }

  async consumeTrade(trade:CryptoTradeMessage) {
    let symbol = trade.pair;

    let price = trade.p;

    let prevPriceLow = this.list_price_low[symbol];
    if (prevPriceLow === undefined || price < prevPriceLow) {
        this.list_price_low[symbol] = price;
    }

    let prevPriceHigh = this.list_price_high[symbol];
    if (prevPriceHigh === undefined || price < prevPriceHigh) {
        this.list_price_high[symbol] = price;
    }
  }

  async consumeAggregate(aggregate:CryptoAggregateMessage) {
    let lowPrice = aggregate.l;
    let highPrice = aggregate.h;

    //console.log(`Low: ${lowPrice} | High: ${highPrice}`);
  }




}
