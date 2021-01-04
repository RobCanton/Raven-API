import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { FirebaseService } from '../../firebase/firebase.service';
import { RedisService } from '../../redis/redis.service';

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

export interface AlertTriggerSet {
  id: string
  value: number
}

export abstract class Consumer {

    protected marketType: MarketType;
    protected logger: Logger;

    constructor(
      marketType: MarketType,
      protected readonly firebaseService: FirebaseService,
      protected readonly redisService: RedisService
    ) {
      this.marketType = marketType;
      this.logger = new Logger(`Consumer ${marketType}`);
    }

    notificationPayload(alert:Alert, triggerValue: number) {

      let symbol = alert.s;
      let type = alert.t;
      let condition = alert.c;
      let value = alert.v;

      var payload = {
        title: "",
        body: ""
      }
      switch (type) {
        case 1:
        switch (condition) {
          case 1:
          payload.title = `${symbol} Alert`;
          payload.body = `${triggerValue} - Price is above ${value}`;
          break
          case 2:
          payload.title = `${symbol} Alert`;
          payload.body = `${triggerValue} - Price is below ${value}`;
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

    async triggerAlert(alertID:string, value:number):Promise<any> {
      let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
      let alert:Alert = JSON.parse(alertStr) as Alert;

      let resetTime = this.resetTime(alert.r);
      await this.redisService.zadd(`fired_alerts`, resetTime, alertID);
      this.logger.log(`Trigger alert: ${alertID}`);

      await this.firebaseService.writeAlert(alertID, alert, value, Date.now());
    }
}
