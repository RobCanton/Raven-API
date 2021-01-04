import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Dictionary } from '../../interfaces/common.interfaces';
import { MarketType } from './market.model';
import { Market } from './clusters/market';
import { StockMarket } from './clusters/stock_market';
import { ForexMarket } from './clusters/forex_market';
import { CryptoMarket } from './clusters/crypto_market';
import { RedisService } from '../redis/redis.service';
import { PolygonService } from '../polygon/polygon.service';
import { IEXService } from '../iex/iex.service';
import { AlgoliaService } from '../algolia/algolia.service';
import * as promiseReflect from 'promise-reflect';
import * as moment from 'moment';
import 'moment-timezone';

export interface PromiseReflectResult<T> {
  status: string
  data: T
}

@Injectable()
export class MarketService {

  private logger: Logger = new Logger('MarketService');

  private markets:Dictionary<Market>;
  constructor(
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService,
    private readonly algoliaService: AlgoliaService
  ) {
    this.markets = {};
    this.markets[MarketType.stocks] = new StockMarket(redisService, polygonService, iexService);
    this.markets[MarketType.forex] = new ForexMarket(redisService, polygonService, iexService, algoliaService);
    this.markets[MarketType.crypto] = new CryptoMarket(redisService, polygonService, iexService, algoliaService);
  }

  typeForSymbol(symbol: string): MarketType {
    if (symbol.startsWith("C:")) {
      return MarketType.forex;
    } else if (symbol.startsWith("X:")) {
      return MarketType.crypto;
    } else {
      return MarketType.stocks;
    }
  }

  async snapshot(symbol: string) {
    let marketType:MarketType = this.typeForSymbol(symbol);
    let response = await this.markets[marketType].snapshot(symbol);
    return response;
  }

  async socketSymbol(symbol: string):Promise<string> {
    let marketType:MarketType = this.typeForSymbol(symbol);
    let response = await this.markets[marketType].socketSymbol(symbol);
    return response;

  }



}
