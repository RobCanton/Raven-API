import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { StockNewsAPIService } from './services/stocknewsapi.service';
import { ExtractorService } from './services/extractor.service';

@Module({
  controllers: [NewsController],
  providers: [NewsService, StockNewsAPIService, ExtractorService]
})
export class NewsModule {
  /*configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }*/
}
