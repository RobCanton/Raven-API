import { Logger } from '@nestjs/common';
import { MarketType } from '../market.model';
import { RedisService } from '../../redis/redis.service';

import * as moment from 'moment';
import 'moment-timezone';

export abstract class Market {

    protected marketType: MarketType;
    constructor(
      marketType: MarketType,
      protected readonly redisService: RedisService
    ) {
      this.marketType = marketType;
    }

    detailsKeyForSymbol(symbol:string) {
      return `ticker_details:${symbol}`;
    }

    abstract details(symbol: string): Promise<any>
    abstract socketSymbol(symbol: string): Promise<string>
    abstract snapshot(symbol:string): Promise<any>
    abstract intraday(symbol: string, multiplier: number):Promise<any>
    abstract aggregate(symbol: string,
      multiplier: number,
      timespan: string,
      from: moment.Moment,
      to: moment.Moment):Promise<any>

}
