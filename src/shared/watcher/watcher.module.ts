import { Module, DynamicModule, Global, HttpModule } from '@nestjs/common';
import { WatcherService } from './watcher.service';
import { WatcherGateway } from './watcher.gateway';
import { MarketService } from '../market/market.service';
import { AlertService } from '../../helpers/alert.service'

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [WatcherGateway, AlertService, MarketService]
})
export class WatcherModule {
  static register(options): DynamicModule {
    return {
      module: WatcherModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        WatcherService
      ],
      exports: [WatcherService],
    };
  }
}
