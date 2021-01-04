import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { FirebaseService } from '../../firebase/firebase.service';
import { RedisService } from '../../redis/redis.service';
import { Consumer } from './consumer';
import { ForexQuoteMessage } from '../watcher.model';
import { Dictionary } from '../../../interfaces/common.interfaces';
import { Alert } from './consumer';

export class ForexConsumer extends Consumer {

  private lowestBid:Dictionary<number>;
  constructor(
    firebaseService: FirebaseService,
    redisService: RedisService
  ) {
    super(MarketType.forex, firebaseService, redisService);
    this.lowestBid = {};
  }

  async nextTick() {
    //console.log("nextTick");
    //console.log("LowestBid: %j", this.lowestBid);

    var deletionPromises = [];
    var triggerPromises = [];

    for (let symbol in this.lowestBid) {
      this.logger.log(`Forex tick: ${symbol} : ${this.lowestBid[symbol]}`);
      let lowBid = this.lowestBid[symbol];
      let priceOverAlertsKey = `alerts_forex_price_over:${symbol}`;
      let priceOverAlerts = await this.redisService.zrangebyscore(priceOverAlertsKey, 0, lowBid) as string[];

      priceOverAlerts.forEach( alertID => {
        this.logger.log("priceOverAlert: ", alertID);
        deletionPromises.push(this.redisService.zrem(priceOverAlertsKey, alertID))
        triggerPromises.push(this.triggerAlert(alertID, lowBid));
      });
    }

    this.lowestBid = {};

    await Promise.all(deletionPromises);
    await Promise.all(triggerPromises);

  }

  async consumerQuote(quote:ForexQuoteMessage) {
    let symbol = quote.p;

    let bid = quote.b;
    let prevBid = this.lowestBid[quote.p];

    if (prevBid === undefined || bid < prevBid) {
        this.lowestBid[quote.p] = bid;
        //console.log("lower bid: ", bid);
    }
  }

  // async consumeAggregate(aggregate:StockAggregateMessage) {
  //   let lowPrice = aggregate.l;
  //   let highPrice = aggregate.h;
  //
  //   console.log(`Low: ${lowPrice} | High: ${highPrice}`);
  // }

}
