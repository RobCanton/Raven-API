import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RedisService } from '../shared/redis/redis.service';
import * as promiseReflect from 'promise-reflect';
import { StockTradeMessage, StockQuoteMessage, StockAggregateMessage } from '../shared/watcher/watcher.model';
import { FirebaseService } from '../shared/firebase/firebase.service';

export interface Alert {
  s: string
  ss: string
  t: number
  c: number
  v: number
  d: number
  u: string
  e: number
  r: number
}
@Injectable()
export class AlertService {

  private logger: Logger = new Logger('AlertService');

  private AlertType = {
    NONE: '0',
    PRICE: '1',
    BID: '2',
    ASK: '3'
  }

  private PriceCondition = {
    NONE: '0',
    IS_OVER: '1',
    IS_UNDER: '2'
  }

  constructor(
    private readonly redisService: RedisService,
    private readonly firebaseService: FirebaseService
  ) {}


  alertSuffix(type: number, condition: number) {
    var alertSuffix;
    switch (type) {
      case 1:
      switch (condition) {
        case 1:
        alertSuffix = 'price_over';
        break
        case 2:
        alertSuffix = 'price_under';
        break
      }
      break
      default:
      break
    }

    return alertSuffix;

  }

  notificationPayload(symbol: string, type: number, condition: number, value: number, price: number) {
    var payload = {
      title: "",
      body: ""
    }
    switch (type) {
      case 1:
      switch (condition) {
        case 1:
        payload.title = `${symbol} Alert`;
        payload.body = `${price} - Price is above ${value}`;
        break
        case 2:
        payload.title = `${symbol} Alert`;
        payload.body = `${price} - Price is below ${value}`;
        break
      }
      break
      default:
      break
    }
    return payload;
  }


  resetTime(resetOption: number):number {
    let now = Date.now();
    switch (resetOption) {
      case 0:
        return undefined;
      case 1:
        return now + 1000 * 60
      case 2:
        return now + 1000 * 60 * 5
      case 3:
        return now + 1000 * 60 * 15
      case 4:
        return now + 1000 * 60 * 30
      case 5:
        return now + 1000 * 60 * 60
      case 6:
        return now;
      default:
        return now;
    }
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

  async triggerAlert(key:string, alertID: string, price:number) {

    let rem = await this.redisService.zrem(key, alertID);

    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    let alert:Alert = JSON.parse(alertStr) as Alert;

    this.logger.log(`Alert triggered: ${alert.s}:${alertID}`);
    //await this.firebaseService.writeAlert(alertID, alert);

    let payload = this.notificationPayload(alert.s,
      alert.t,
      alert.c,
      alert.v,
      price);
    await this.userNotify(alert.u, payload.title, payload.body);

    let resetTime = this.resetTime(alert.r);
    if (resetTime) {
      await this.redisService.zadd(`fired_alerts`, resetTime, alertID);
    }



    return;
  }

  async consumeAggregateMessage(message: StockAggregateMessage) {
    let priceOverAlertsKey = `alerts_price_over:${message.sym}`;

    let priceOverAlerts = await this.redisService.zrangebyscore(priceOverAlertsKey, 0, message.l) as string[];
    var promises = [];
    priceOverAlerts.forEach( alertID => {
      let triggerAlert = this.triggerAlert(priceOverAlertsKey,alertID, message.l);
      promises.push(triggerAlert);
    })

    let priceUnderAlertsKey = `alerts_price_under:${message.sym}`;
    let priceUnderAlerts = await this.redisService.zrangebyscore(priceUnderAlertsKey, message.h, 999999999) as string[];
    priceUnderAlerts.forEach( alertID => {
      let triggerAlert = this.triggerAlert(priceUnderAlertsKey,alertID, message.h);
      promises.push(triggerAlert);
    })

    await Promise.all(promises);
    return;
  }

}
