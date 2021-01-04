import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { StockService } from '../../helpers/stock.service';

@Module({
  controllers: [ReferenceController],
  providers: [ReferenceService, StockService]
})
export class ReferenceModule {
  /*configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }*/
}
