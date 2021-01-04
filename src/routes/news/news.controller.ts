import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}


  @Get()
  getStatus() {
    return { status: 'news' }
  }

  @Get('/symbols')
  async getNews(@Query('symbols') symbols: string) {
    let response = await this.newsService.getNewsForSymbols(symbols, 15);
    return response;
  }

  @Get('/market')
  async getMarketNews() {
    let response = await this.newsService.getMarketNews();
    return response;
  }

  @Get('/trending')
  async getTrendingStocksNews() {
    let response = await this.newsService.getTrendingStocksNews();
    return response;
  }

  @Get('/topic/:topic')
  async getTopic(@Param('topic') topic: string) {
    let response = await this.newsService.getNewsForTopic(topic);
    return response;
  }

  @Get('/alltickers')
  async getAllTickers(
    @Query('topic') topic:string,
    @Query('topicOR') topicOR:string,
    @Query('sector') sector:string,
    @Query('sectorexclude') sectorexclude:string,
    @Query('search') search: string,
    @Query('searchOR') searchOR: string,
    @Query('country') country: string
  ) {
    let response = await this.newsService.getNewsForAllTickers(
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

  @Post('/extract')
  async extract(@Body('url') url: string) {
    console.log("URL: ", url);
    let response = await this.newsService.extract(url);
    return response;
  }

}
