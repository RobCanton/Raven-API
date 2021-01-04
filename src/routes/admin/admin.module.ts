import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AlertService } from '../../helpers/alert.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AlertService]
})
export class AdminModule {
  /*configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }*/
}
