import { Market } from './market';
import { MarketType, Forex } from '../market.model';
import { RedisService } from '../../redis/redis.service';
import { PolygonService } from '../../polygon/polygon.service';
import { IEXService } from '../../iex/iex.service';
import { AlgoliaService } from '../../algolia/algolia.service';
import * as moment from 'moment';
import 'moment-timezone';

export class ForexMarket extends Market {

  constructor(
    redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService,
    private readonly algoliaService: AlgoliaService) {
    super(MarketType.forex, redisService);
  }

  async details(symbol:string):Promise<Forex.Details> {
    let details = await this.algoliaService.getForexObject(symbol);
    return details;
  }

  async socketSymbol(symbol:string):Promise<string> {
    let details:Forex.Details = await this.details(symbol);
    let socketSymbol = `${details.attrs.base}/${details.attrs.currency}`;
    return socketSymbol;
  }

  async snapshot(symbol:string):Promise<any> {
    let details:Forex.Details = await this.details(symbol);
    let from = details.attrs.base;
    let to = details.attrs.currency;
    let socketSymbol = `${from}/${to}`;
    console.log(from);
    console.log(to);

    let _lastQuote = await this.polygonService.forexLastQuote(from, to);
    let lastQuote:Forex.Quote = {
      a: _lastQuote.ask,
      b: _lastQuote.bid,
      x: _lastQuote.exchange,
      t: _lastQuote.timestamp,
    }

    let prev = await this.polygonService.forexPreviousClose(symbol);
    console.log("Prev: %j", prev);

    return {
      symbol: symbol,
      socketSymbol: socketSymbol,
      marketType: this.marketType,
      details: details,
      quotes: [lastQuote],
      prevClose: prev
    };
  }

  async intraday(symbol: string, multiplier: number) {
    return null;
  }

  async aggregate(symbol: string,
    multiplier: number,
    timespan: string,
    from: moment.Moment,
    to: moment.Moment) {
      return null;
  }
}
