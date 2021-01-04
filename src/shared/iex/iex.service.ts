import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import * as rp from 'request-promise';

export interface IEXStockQuote {
  symbol: string
  marketCap: number
  latestPrice: number
}

export interface IEXSearchResult {
  symbol: string
  securityName: string
  securityType: string
  region: string
  exchange: string
}

@Injectable()
export class IEXService {

  private api_key: string;
  constructor(@Inject('CONFIG_OPTIONS') private options) {
    this.api_key = options.api_key;
  }

  private iexURI(route:string, params?: Array<[string,string]>) {

    let baseURL = "https://cloud.iexapis.com/stable/";
    var paramsStr = `?token=${this.api_key}`;

    if (params) {
      params.forEach(element => {
        paramsStr += `&${element[0]}=${element[1]}`;
      });
    }

    return `${baseURL}${route}${paramsStr}`;
  }

  private jsonRequest(uri: string) {
    return {
      uri: uri,
      json: true
    }
  }

  async search(query: string): Promise<Array<IEXSearchResult>> {
    let route = `search/${query}`;
    let uri = this.iexURI(route);
    return rp(this.jsonRequest(uri));
  }

  async stockQuote(symbol: string):Promise<IEXStockQuote> {
    let route = `stock/${symbol}/quote`;
    let uri = this.iexURI(route);
    return rp(this.jsonRequest(uri)).then ( results => {
      return {
        symbol: results.symbol,
        marketCap: results.marketCap,
        latestPrice: results.latestPrice
      }
    }).catch( e => {
      return {}
    });
  }

  async listMostActive():Promise<IEXStockQuote[]> {
    let route = `/stock/market/list/mostactive`;
    let uri = this.iexURI(route);
    return rp(this.jsonRequest(uri));
  }

  async news(symbol: string, count: number) {
    let route = `/stock/${symbol}/news/last/${count}`;
    let uri = this.iexURI(route);
    return rp(this.jsonRequest(uri));
  }

}
