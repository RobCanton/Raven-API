import { Market } from './market';
import { MarketType, Crypto } from '../market.model';
import { RedisService } from '../../redis/redis.service';
import { Polygon } from '../../polygon/polygon.model';
import { PolygonService } from '../../polygon/polygon.service';
import { AlgoliaService } from '../../algolia/algolia.service';
import { IEXService } from '../../iex/iex.service';
import * as moment from 'moment';
import 'moment-timezone';

export class CryptoMarket extends Market {

  constructor(
    redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService,
    private readonly algoliaService: AlgoliaService) {
    super(MarketType.crypto, redisService);
  }

  async details(symbol:string):Promise<Crypto.Details> {
    let details = await this.algoliaService.getCryptoObject(symbol);
    return details;
  }

  async socketSymbol(symbol:string):Promise<string> {
    let details:Crypto.Details = await this.details(symbol);
    let socketSymbol = `${details.attrs.base}-${details.attrs.currency}`;
    return socketSymbol;
  }

  async snapshot(symbol:string):Promise<any> {
    let details:Crypto.Details = await this.details(symbol);
    let socketSymbol = `${details.attrs.base}-${details.attrs.currency}`;
    let from = details.attrs.base;
    let to = details.attrs.currency;

    let liveSnapshot = await this.polygonService.cryptoSnapshotSingle(symbol) as Polygon.Crypto.Snapshot;
    if (liveSnapshot) {
      return {
        symbol: symbol,
        socketSymbol: socketSymbol,
        marketType: this.marketType,
        details: details,
        day: liveSnapshot.day,
        trades: [liveSnapshot.lastTrade],
        prevDay: liveSnapshot.prevDay
      };
    }

    let lastTrade = await this.polygonService.cryptoLastTrade(from, to);

    let prevDay = await this.polygonService.cryptoPrev(symbol);
    
    return {
      symbol: symbol,
      socketSymbol: socketSymbol,
      marketType: this.marketType,
      details: details,
      trades: [lastTrade],
      prevDay: prevDay
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
