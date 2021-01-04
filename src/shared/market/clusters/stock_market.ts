import { NotFoundException, Logger } from '@nestjs/common';
import { Market } from './market';
import { MarketType } from '../market.model';
import { RedisService } from '../../redis/redis.service';
import { PolygonService } from '../../polygon/polygon.service';
import { IEXService } from '../../iex/iex.service';
import { Polygon } from '../../polygon/polygon.model'
import { TimeRange, Stock } from '../market.model';
import * as promiseReflect from 'promise-reflect';
import * as moment from 'moment';
import 'moment-timezone';

export class StockMarket extends Market {

private logger: Logger = new Logger('StockMarket');

  constructor(
    redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService) {
    super(MarketType.stocks, redisService);
  }

  async details(symbol:string):Promise<Stock.Details> {
    var stockDetails:Stock.Details;

    let tickerDetailsKey = this.detailsKeyForSymbol(symbol);
    let redisDetailsStr = await this.redisService.get(tickerDetailsKey) as string;

    if (redisDetailsStr) {
      stockDetails = JSON.parse(redisDetailsStr);
    } else {
      const polygonStockDetails = await this.polygonService.tickerDetails(symbol);

      if (polygonStockDetails) {
        stockDetails = {
          symbol: polygonStockDetails.symbol,
          name: polygonStockDetails.name,
          description: polygonStockDetails.description,
          shares: null
        };

        const iexStockQuote = await this.iexService.stockQuote(symbol);
        stockDetails.shares = iexStockQuote.marketCap / iexStockQuote.latestPrice;

        let stockDetailsStr = JSON.stringify(stockDetails);
        await this.redisService.set(tickerDetailsKey, stockDetailsStr);
        await this.redisService.expire(tickerDetailsKey, 1440); // Expire after 4 hours

      }

    }
    return stockDetails;
  }

  async socketSymbol(symbol:string):Promise<string> {
    return symbol;
  }

  async snapshot(symbol:string) {
    let details:Stock.Details = await this.details(symbol);

    let intraday:Stock.AggregateResponse = await this.intraday(symbol, 30);

    let liveSnapshot = await this.polygonService.stockSnapshotSingle(symbol) as Polygon.StockSnapshot;

    if (liveSnapshot) {
      let day:Stock.DailyStats = {
        close: liveSnapshot.day.c,
        high: liveSnapshot.day.h,
        low: liveSnapshot.day.l,
        open: liveSnapshot.day.o,
        volume: liveSnapshot.day.v
      };

      let prevClose:Stock.DailyStats = {
        close: liveSnapshot.prevDay.c,
        high: liveSnapshot.prevDay.h,
        low: liveSnapshot.prevDay.l,
        open: liveSnapshot.prevDay.o,
        volume: liveSnapshot.prevDay.v
      };

      let lastTrade:Stock.Trade = {
        price: liveSnapshot.lastTrade.p,
        size: liveSnapshot.lastTrade.s,
        exchange: liveSnapshot.lastTrade.x,
        timestamp: liveSnapshot.lastTrade.t
      }

      let lastQuote:Stock.Quote = {
        askprice: liveSnapshot.lastQuote.P,
        asksize: liveSnapshot.lastQuote.S,
        askechange: null,
        bidprice: liveSnapshot.lastQuote.p,
        bidsize: liveSnapshot.lastQuote.s,
        bidexchange:null,
        timestamp: liveSnapshot.lastQuote.t
      }

      let response = {
        symbol: symbol,
        socketSymbol: symbol,
        marketType: this.marketType,
        details: details,
        day: day,
        trades: [lastTrade],
        quotes: [lastQuote],
        aggregatesSecond: [],
        previousClose: prevClose,
        intraday: intraday
      };
      return response;
    }

    const lastTrade = await this.polygonService.stockLastTrade(symbol);
    const lastQuote = await this.polygonService.stockLastQuote(symbol);

    let m1 = moment().tz('America/New_York');
    let mDay1 = m1.day();

    var prevClose;
    var prevCloseDiff = 2;

    switch (mDay1) {
      case 0:
        prevCloseDiff = 3;
        break;
      case 1:
        prevCloseDiff = 4;
        break;
    }

    let prevCloseFetchDate = m1.subtract(prevCloseDiff, 'day').format('YYYY-MM-DD');
    this.logger.log(`snapshot prevClose fetchDate: ${prevCloseFetchDate}`);
    prevClose = await this.polygonService.stockDailyOpenClose(symbol, prevCloseFetchDate);

    let m2 = moment().tz('America/New_York');
    let mDay2 = m2.day();

    var day;
    var dayDiff = 1;

    switch (mDay2) {
      case 0:
        dayDiff = 2;
        break;
      case 1:
        dayDiff = 3;
        break;
    }

    let dayFetchDate = m2.subtract(dayDiff, 'day').format('YYYY-MM-DD');
    this.logger.log(`snapshot day fetchDate: ${dayFetchDate}`);
    day = await this.polygonService.stockDailyOpenClose(symbol, dayFetchDate);

    return {
      symbol: symbol,
      socketSymbol: symbol,
      marketType: this.marketType,
      details: details,
      day: day,
      trades: [lastTrade],
      quotes: [lastQuote],
      aggregatesSecond: [],
      previousClose: prevClose,
      intraday: intraday
    };
  }

  async intraday(symbol: string, multiplier: number) {

    let timespan = 'minute';

    var m = moment().tz('America/New_York');
    let mDay = m.day();
    let mHour = m.hour();


    if (mDay == 6) {
      m = m.subtract(1, 'day');
    } else if (mDay == 0) {
      m = m.subtract(2, 'day');
    } else if (mHour < 4) {
      m = m.subtract(1, 'day');
    }

    let polygonResponse = await this.aggregate(symbol, multiplier, timespan, m, m);

    let start = m.startOf('day').add(9.5, 'hours').unix();
    let end = m.startOf('day').add(16, 'hours').unix();
    let offset = m.utcOffset();

    let timeRange:TimeRange  = { start: start, end: end, offset: offset };
    let response:Stock.AggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async aggregate(symbol: string,
    multiplier: number,
    timespan: string,
    from: moment.Moment,
    to: moment.Moment) {

    let fromStr = from.format("YYYY-MM-DD");
    let toStr = to.format("YYYY-MM-DD");

    let polygonResponse = await this.polygonService.stockAggregates(symbol, multiplier, timespan, fromStr, toStr) as Polygon.AggregateResponse;
    return polygonResponse;
  }

}
