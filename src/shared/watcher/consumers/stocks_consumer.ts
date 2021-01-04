import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { FirebaseService } from '../../firebase/firebase.service';
import { RedisService } from '../../redis/redis.service';
import { Consumer } from './consumer';
import { StockAggregateMessage } from '../watcher.model';
import { Interval } from '@proscom/nestjs-schedule';
import { Alert } from './consumer';

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
export interface StockAggregateMessage extends Message {
  sym: string
  v: number
  av: number
  op: number
  vw: number
  o: number
  c: number
  h: number
  l: number
  a: number
  s: number
  e: number
}*/


export class StocksConsumer extends Consumer {

  constructor(
    firebaseService: FirebaseService,
    redisService: RedisService
  ) {

    super(MarketType.stocks, firebaseService, redisService);
  }

  @Interval(10000)
  async nextTick() {
    //console.log("process")
  }

  async consumeAggregate(aggregate:StockAggregateMessage) {
    let lowPrice = aggregate.l;
    let highPrice = aggregate.h;

    var multiDelete = this.redisService.multi();

    let symbol = aggregate.sym;
    //console.log(`${symbol} - Low: ${lowPrice} | High: ${highPrice}`);

    let priceOverAlertsKey = `alerts_stocks_price_over:${symbol}`;
    let priceOverAlerts = await this.redisService.zrangebyscore(priceOverAlertsKey, 0, lowPrice) as string[];

    let priceUnderAlertsKey = `alerts_stocks_price_under:${symbol}`;
    let priceUnderAlerts = await this.redisService.zrangebyscore(priceUnderAlertsKey, 0, highPrice) as string[];

    var deletionPromises = [];
    var triggerPromises = [];

    priceOverAlerts.forEach( alertID => {
      console.log("priceOverAlert: ", alertID);

      multiDelete.zrem(priceOverAlertsKey, alertID);
      triggerPromises.push(this.triggerAlert(alertID, lowPrice));
    });

    priceUnderAlerts.forEach( alertID => {
      console.log("priceUnderAlert: ", alertID);

      multiDelete.zrem(priceUnderAlertsKey, alertID);

      triggerPromises.push(this.triggerAlert(alertID, highPrice));
    });

    await multiDelete.exec();
    
    await Promise.all(triggerPromises);
  }

  /*
  async triggerAlert(alertID:string, value:number) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    let alert:Alert = JSON.parse(alertStr) as Alert;



    let resetTime = this.resetTime(alert.r);
    await this.redisService.zadd(`fired_alerts`, resetTime, alertID);
    console.log("trigger alert: %j", alert);
  }*/

}
