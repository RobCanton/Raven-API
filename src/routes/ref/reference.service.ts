import { Injectable, NotFoundException } from '@nestjs/common';
import { IEXService } from '../../shared/iex/iex.service';
import { RedisService } from '../../shared/redis/redis.service';
import { TimeRange, StockAggregateResponse } from '../../helpers/stock.model';
import { StockService } from '../../helpers/stock.service';
import { PolygonService, PolygonAggregateResponse, PolygonAggregateTick } from '../../shared/polygon/polygon.service';
import { AlgoliaService } from '../../shared/algolia/algolia.service';
import * as moment from 'moment';
import 'moment-timezone';



@Injectable()
export class ReferenceService {

  constructor(
    private readonly redisService: RedisService,
    private readonly iexService: IEXService,
    private readonly stockService: StockService,
    private readonly polygonService: PolygonService,
    private readonly algoliaService: AlgoliaService
  ) {}

  async marketStatus() {
    let result = await this.redisService.get('market-status') as string;
    return result;
  }

  async search(fragment: string) {
    let results = await this.stockService.search(fragment);
    return results;
  }

  async searchForex(fragment: string) {
    let results = await this.algoliaService.searchForex(fragment);
    console.log(`searchForex: ${results}`);
    return results.hits;
  }

  async searchCrypto(fragment: string) {
    let results = await this.algoliaService.searchCrypto(fragment);
    return results.hits;
  }

  async stockAggregateOneDay(symbol: string) {
    let response = await this.stockService.stockAggregateIntraday(symbol, 10);
    return response;
  }

  async stockAggregateOneWeek(symbol: string) {
    let multiplier = 1;
    let timespan = 'hour';

    let from = moment().tz('America/New_York').subtract(7, 'days');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange  = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateOneMonth(symbol: string) {
    let multiplier = 1;
    let timespan = 'day';

    let from = moment().tz('America/New_York').subtract(1, 'months');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateThreeMonths(symbol: string) {
    let multiplier = 1;
    let timespan = 'day';

    let from = moment().tz('America/New_York').subtract(3, 'months');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateSixMonths(symbol: string) {
    let multiplier = 2;
    let timespan = 'day';

    let from = moment().tz('America/New_York').subtract(6, 'months');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateYearToDate(symbol: string) {
    let multiplier = 4;
    let timespan = 'day';

    let from = moment().tz('America/New_York').startOf('year');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateOneYear(symbol: string) {
    let multiplier = 4;
    let timespan = 'day';

    let from = moment().tz('America/New_York').subtract(1, 'years');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateTwoYears(symbol: string) {
    let multiplier = 8
    let timespan = 'day';

    let from = moment().tz('America/New_York').subtract(2, 'years');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }

  async stockAggregateFiveYears(symbol: string) {
    let multiplier = 20
    let timespan = 'day';

    let from = moment().tz('America/New_York').subtract(5, 'years');
    let to = moment().tz('America/New_York');

    let polygonResponse = await this.stockService.stockAggregates(symbol, multiplier, timespan, from, to);
    let results = polygonResponse.results;
    var start = 0;
    var end = 0;
    if (results.length > 2) {
      start = results[0].t / 1000;
      end = results[results.length-1].t / 1000;
    }

    let offset = to.utcOffset();

    let timeRange:TimeRange = { start: start, end: end, offset: offset };
    let response:StockAggregateResponse = {...polygonResponse, ...timeRange};
    return response;
  }


  async polygonEnabled(symbols: Array<string>) {
    let results = await this.stockService.polygonEnabledSymbols(symbols);
    return results;
  }

  async getNews(symbol: string, count: number) {
    let results = await this.iexService.news(symbol, count);
    return results;
  }
}
