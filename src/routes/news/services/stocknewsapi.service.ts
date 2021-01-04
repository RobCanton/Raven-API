import { Injectable, NotFoundException } from '@nestjs/common';
import axios, {AxiosResponse} from 'axios';


@Injectable()
export class StockNewsAPIService {
  private apiKey = 't9j05gpbb6vaqp205gow2kjwzdtpzhbirbpgqw7w';
  private url = "https://stocknewsapi.com/api/v1?";

  constructor() {

  }

  private buildURI(route?:string, params?: Array<[string,string]>) {

    let baseURL = "https://stocknewsapi.com/api/v1";
    var paramsStr = `?token=${this.apiKey}`;

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

  async marketNews(count: number) {

    let route = "/category";
    let params:Array<[string, string]> = [
      ['section', 'general'], ['items', `${count}`],
      ['sortby', 'rank']
    ];
    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (exception) {
      console.log("Error: ", exception)
      return [];
    }
  }

  async trendingStocksNews(count: number) {

    let route = "/top-mention";
    let params:Array<[string, string]> = [
      ['date', 'today']
    ];
    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (exception) {
      console.log("Error: ", exception)
      return [];
    }
  }

  async getNews(symbol: string, count: number) {

    //tickers=FB&items=50&
    let params:Array<[string, string]> = [
      ['tickers', symbol], ['items', `${count}`]
    ];

    let uri = this.buildURI(null, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (exception) {
      return [];
    }
  }

  async getNewsForAllTickers(
    topic: string,
    topicOR: string,
    sector: string,
    sectorexclude: string,
    search: string,
    searchOR: string,
    country:string
  ) {
    let route = "/category";
    var params:Array<[string, string]> = [
      ['section', 'alltickers'], ['items', `${50}`]
    ];

    if (topic) {
      params.push(['topic', topic]);
    }

    if (topicOR) {
      params.push(['topicOR', topicOR]);
    }

    if (sector) {
      params.push(['sector', sector]);
    }

    if (sectorexclude) {
      params.push(['sectorexclude', sectorexclude]);
    }

    if (search) {
      params.push(['search', search]);
    }

    if (searchOR) {
      params.push(['searchOR', searchOR]);
    }

    if (country) {
      params.push(['country', country]);
    }
    console.log(params);

    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (exception) {
      console.log("Error: ", exception)
      return [];
    }
  }

  async getNewsForTopic(topic: string, count: number) {
    let route = "/category";
    let params:Array<[string, string]> = [
      ['section', 'alltickers'], ['items', `${count}`],
      ['searchOR', topic]
    ];
    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch (exception) {
      console.log("Error: ", exception)
      return [];
    }
  }
}
