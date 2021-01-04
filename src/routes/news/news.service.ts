import { Injectable, NotFoundException } from '@nestjs/common';
import { StockNewsAPIService } from './services/stocknewsapi.service';
import { ExtractorService, Extract, ExtractArticle } from './services/extractor.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import axios from 'axios';


@Injectable()
export class NewsService {

  constructor(private readonly stockNewsAPIService:StockNewsAPIService,
    private readonly extractorService:ExtractorService,
    private readonly firebaseService:FirebaseService) {

  }

  async getMarketNews() {
    let response = this.stockNewsAPIService.marketNews(50);
    return response;
  }

  async getTrendingStocksNews() {
    let response = this.stockNewsAPIService.trendingStocksNews(50);
    return response;
  }

  async getNewsForSymbols(symbols: string, count: number) {
    let response = this.stockNewsAPIService.getNews(symbols, count);
    return response;
  }

  async getNewsForTopic(topic: string) {
    let response = this.stockNewsAPIService.getNewsForTopic(topic, 50);
    return response;
  }


  async getNewsForAllTickers(
    topic: string,
    topicOR: string,
    sector: string,
    sectorexclude: string,
    search: string,
    searchOR: string,
    country: string
  ) {

    let response = await this.stockNewsAPIService.getNewsForAllTickers(
      topic,
      topicOR,
      sector,
      sectorexclude,
      search,
      searchOR,
      country
    );
    return response;
  }
  async extract(url:string) {
    let firestore = this.firebaseService.firestore();
    let buffer = Buffer.from(url);
    let urlBase64 = buffer.toString('base64');
    let docRef = firestore.collection('extracts').doc(urlBase64);

    let doc = await docRef.get();
    if (doc.data()) {
      return doc.data();
    }

    let response = await this.extractorService.extract(url) as Extract;
    if (response) {
      let firestore = this.firebaseService.firestore();
      await docRef.set(response);
      return response;
    } else {
      return null;
    }

  }

}
