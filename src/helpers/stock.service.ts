import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { StockDetails, StockDailyStats,
  StockSnapshot, StockTrade, StockQuote,
  TimeRange, StockAggregateResponse } from './stock.model';
import { RedisService } from '../shared/redis/redis.service';
import { PolygonService, PolygonStockDetails,
  PolygonTickerWrapper, PolygonTicker,
  MarketStatus, PolygonAggregateResponse } from '../shared/polygon/polygon.service';
import { Polygon } from '../shared/polygon/polygon.model'
import { IEXService } from '../shared/iex/iex.service';
import * as promiseReflect from 'promise-reflect';
import * as moment from 'moment';
import 'moment-timezone';

export interface PromiseReflectResult<T> {
  status: string
  data: T
}


@Injectable()
export class StockService {

  private logger: Logger = new Logger('StockService');

  constructor(
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService
  ) {}

  async marketStatus() {
    let response = await this.polygonService.marketStatus() as MarketStatus;

    var status = response.market;
    if (status === "extended-hours") {
      let now = moment().tz('America/New_York');
      let currentHour = now.hour();
      if (currentHour < 12) {
        status = "pre-market";
      } else{
        status = "after-hours";
      }
    }

    return status;
  }

  async snapshot(symbol: string):Promise<StockSnapshot> {
    var stockDetails;

    let tickerDetailsKey = `ticker_details:${symbol}`;
    let redisDetailsStr = await this.redisService.get(tickerDetailsKey) as string;

    if (redisDetailsStr) {
      stockDetails = JSON.parse(redisDetailsStr);
      this.logger.log(`stockDetails:${symbol} old`);
    } else {
      const polygonStockDetails = await this.polygonService.tickerDetails(symbol);
      const iexStockQuote = await this.iexService.stockQuote(symbol);

      let shares = iexStockQuote.marketCap / iexStockQuote.latestPrice;
      stockDetails = {
        symbol: polygonStockDetails.symbol,
        name: polygonStockDetails.name,
        description: polygonStockDetails.description,
        shares: shares
      };

      let stockDetailsStr = JSON.stringify(stockDetails);
      await this.redisService.set(`ticker_details:${symbol}`, stockDetailsStr);
      await this.redisService.expire(`ticker_details:${symbol}`, 1440); // Expire after 4 hours
      this.logger.log(`stockDetails:${symbol} new`);
    }

    let intraday = await this.stockAggregateIntraday(symbol, 30);

    let snapshot = await this.polygonService.stockSnapshotSingle(symbol) as Polygon.StockSnapshot;

    if (snapshot) {
      let day:StockDailyStats = {
        close: snapshot.day.c,
        high: snapshot.day.h,
        low: snapshot.day.l,
        open: snapshot.day.o,
        volume: snapshot.day.v
      };

      let prevClose:StockDailyStats = {
        close: snapshot.prevDay.c,
        high: snapshot.prevDay.h,
        low: snapshot.prevDay.l,
        open: snapshot.prevDay.o,
        volume: snapshot.prevDay.v
      };

      let lastTrade:StockTrade = {
        price: snapshot.lastTrade.p,
        size: snapshot.lastTrade.s,
        exchange: snapshot.lastTrade.x,
        timestamp: snapshot.lastTrade.t
      }

      let lastQuote:StockQuote = {
        askprice: snapshot.lastQuote.P,
        asksize: snapshot.lastQuote.S,
        askechange: null,
        bidprice: snapshot.lastQuote.p,
        bidsize: snapshot.lastQuote.s,
        bidexchange:null,
        timestamp: snapshot.lastQuote.t
      }

      let response = {
        symbol: symbol,
        details: stockDetails,
        day: day,
        trades: [lastTrade],
        quotes: [lastQuote],
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
      details: stockDetails,
      day: day,
      trades: [lastTrade],
      quotes: [lastQuote],
      previousClose: prevClose,
      intraday: intraday
    };
  }

  async polygonEnabledSymbols(symbols:string[]) {
    var validSymbols = [];
    var redisPromises = [];

    symbols.forEach( symbol => {
      let checkIsMember = this.redisService.sismember('polygon_enabled', symbol);
      redisPromises.push(checkIsMember);
    })

    let redisCheckResults = await Promise.all(redisPromises);

    var polygonPromises = [];
    for (var i = 0; i < redisCheckResults.length; i++) {
      let symbol = symbols[i];
      if (redisCheckResults[i]) {
        if (!validSymbols.includes(symbol)) {
          validSymbols.push(symbol);
        }
      } else {
        let checkPolygon = this.polygonService.ticker(symbol);
        polygonPromises.push(checkPolygon);
      }
    }

    let polygonCheckResults = await Promise.all(polygonPromises.map(promiseReflect)) as Array<PromiseReflectResult<PolygonTickerWrapper>>;

    var redisSADDPromises = [];

    for (var j = 0; j < polygonCheckResults.length; j++) {
      let result = polygonCheckResults[j];
      if (result.status === 'resolved' && result.data && result.data.symbol && result.data.symbol.symbol) {
        let symbol = result.data.symbol.symbol;
        if (!validSymbols.includes(symbol)) {
          validSymbols.push(symbol);
        }

        let setPolygonEnabled = this.redisService.sadd('polygon_enabled', symbol);
        redisSADDPromises.push(setPolygonEnabled);
      }
    }

    await Promise.all(redisSADDPromises);

    return validSymbols;
  }

  async search(fragment: string) {

    var searchSymbols = [];

    let searchResults = await this.iexService.search(fragment);
    searchResults.forEach( result => {
      if (result.region === 'US') {
        searchSymbols.push(result.symbol);
      }
    })

    let validSymbols = await this.polygonEnabledSymbols(searchSymbols);
    var response = [];
    for (var i = 0; i < searchResults.length; i++) {
      let searchResult = searchResults[i];
      if (validSymbols.includes(searchResult.symbol)) {
        response.push(searchResult);
      }
    }
    return response;
  }

  async stockAggregateIntraday(symbol: string, multiplier: number) {

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

    let polygonResponse = await this.stockAggregates(symbol, multiplier, timespan, m, m);

    let start = m.startOf('day').add(9.5, 'hours').unix();
    let end = m.startOf('day').add(16, 'hours').unix();
    let offset = m.utcOffset();

    let timeRange:TimeRange  = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregates(symbol: string,
    multiplier: number,
    timespan: string,
    from: moment.Moment,
    to: moment.Moment) {

    let fromStr = from.format("YYYY-MM-DD");
    let toStr = to.format("YYYY-MM-DD");

    let polygonResponse = await this.polygonService.stockAggregates(symbol, multiplier, timespan, fromStr, toStr) as PolygonAggregateResponse;
    return polygonResponse;
  }

  async getMostActiveStocks() {
    let mostActiveStocks = await this.redisService.lrange(`list:mostactivestocks`, 0 , -1) as string[];
    var promises_mostActiveStockSnapshots = [];
    mostActiveStocks.forEach( symbol => {
      console.log("snapshot for symbol: ", symbol);
      promises_mostActiveStockSnapshots.push(this.snapshot(symbol));
    })

    let mostActiveStockSnapshots = await Promise.all(promises_mostActiveStockSnapshots);
    let mostActiveStockReflections = await Promise.all(promises_mostActiveStockSnapshots.map(promiseReflect)) as Array<PromiseReflectResult<any>>;
    var results = [];
    mostActiveStockReflections.forEach( data => {
      results.push(data.data);
    })
    return results;
  }
}
