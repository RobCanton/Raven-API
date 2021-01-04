import { Injectable, Inject, HttpService, InternalServerErrorException, Logger } from '@nestjs/common';
import { Polygon } from './polygon.model';
import axios, { AxiosResponse } from 'axios';

export interface PolygonTickerWrapper {
  symbol: PolygonTicker
}

export interface PolygonTicker {
  symbol: string
}

export interface PolygonStockDetails {
  symbol: string
  name: string
  description: string
}

export interface PolygonStockTrade {
  price: number
  size: number
  exchange: number
  timestamp: number
}

export interface PolygonStockQuote {
  askprice: number
  asksize: number
  askechange: number
  bidprice: number
  bidsize: number
  bidexchange:number
  timestamp: number
}

export interface PolygonStockClose {
  volume: number
  open: number
  close: number
  low: number
  high: number
  symbol: string
}

export interface PolygonAggregateResponse {
  results: PolygonAggregateTick[]
}

export interface PolygonAggregateTick {
  T: string
  v: number
  o: number
  c: number
  h: number
  l: number
  t: number
  n: number
}

export interface MarketStatus {
  market: string
  serverTime: string
}

@Injectable()
export class PolygonService {

  private logger: Logger = new Logger('PolygonService');

  private apiKey: string;
  constructor(@Inject('CONFIG_OPTIONS') private options, private httpService: HttpService) {
    this.apiKey = options.api_key;
  }

  private buildURI(route?:string, params?: Array<[string,string]>) {

    let baseURL = "https://api.polygon.io";
    var paramsStr = `?apiKey=${this.apiKey}`;

    if (params) {
      params.forEach(element => {
        paramsStr += `&${element[0]}=${element[1]}`;
      });
    }

    if (route) {
      return `${baseURL}${route}${paramsStr}`;
    } else {
      return `${baseURL}${paramsStr}`;
    }
  }

  async marketStatus(): Promise<MarketStatus> {
    let route = "/v1/marketstatus/now";
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async ticker(symbol):Promise<PolygonTicker> {
    let route = `/v1/meta/symbols/${symbol}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async tickers(searchFragment: string) {
    let route = `/v2/reference/tickers`;

    let params:Array<[string, string]> = [
      ['sort', 'ticker'], ['search', searchFragment]
    ];

    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async tickerDetails(ticker: string):Promise<PolygonStockDetails> {
    let route = `/v1/meta/symbols/${ticker}/company`;

    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async stockLastTrade(ticker: string): Promise<PolygonStockTrade> {
    let route = `/v1/last/stocks/${ticker}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data.last;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async stockLastQuote(ticker: string): Promise<PolygonStockQuote> {
    let route = `/v1/last_quote/stocks/${ticker}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data.last;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async stockDailyOpenClose(ticker: string, date: string): Promise<PolygonStockClose> {
    let route = `/v1/open-close/${ticker}/${date}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }

  }

  async stockSnapshotSingle(ticker: string): Promise<Polygon.StockSnapshot> {

    let route = `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data.ticker;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }

  }

  async stockAggregates(ticker: string, multiplier: number, timespan:string, from: string, to: string):Promise<PolygonAggregateResponse> {
    let route = `/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  // Crypto Market
  async cryptoSnapshotSingle(ticker: string): Promise<Polygon.Crypto.Snapshot> {
    let route = `/v2/snapshot/locale/global/markets/crypto/tickers/${ticker}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data.ticker;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async cryptoLastTrade(from: string, to: string):Promise<Polygon.Crypto.Trade> {
    let route = `/v1/last/crypto/${from}/${to}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      let lastTradeFull:Polygon.Crypto.TradeFull = response.data.last;
      let lastTrade:Polygon.Crypto.Trade = {
        c: lastTradeFull.conditions,
        i: "",
        p: lastTradeFull.price,
        s: lastTradeFull.size,
        t: lastTradeFull.timestamp,
        x: lastTradeFull.exchange
      }
      return lastTrade;
    } catch(e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async cryptoPrev(ticker:string):Promise<any> {
    let route = `/v2/aggs/ticker/${ticker}/prev`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      let results = response.data.results;
      if (results.length > 0) {
        return results[0];
      } {
        return null;
      }
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      console.log(e);
      return null;
    }
  }


  // Forex Market
  async forexSnapshotSingle(ticker: string): Promise<Polygon.Forex.Snapshot> {
    let route = `/v1/conversion/USD/CAD`;
    let params:Array<[string, string]> = [
      ['amount', '1'], ['precision', '2']
    ];
    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async forexLastQuote(from:string, to: string):Promise<Polygon.Forex.Quote> {
    let route = `/v1/last_quote/currencies/${from}/${to}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      let quoteResponse:Polygon.Forex.QuoteResponse = response.data;
      return quoteResponse.last;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

  async forexPreviousClose(ticker:string):Promise<Polygon.Forex.PreviousClose> {
    let route = `/v2/aggs/ticker/${ticker}/prev`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      let previousCloseResponse:Polygon.Forex.PreviousCloseResponse = response.data;
      let result:Polygon.Forex.PreviousClose = previousCloseResponse.results[0];
      return result;
    } catch (e) {
      this.logger.log(`${e.name}: ${e.message}`);
      return null;
    }
  }

}
