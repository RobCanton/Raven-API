import { Module, DynamicModule, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  controllers: [],
  providers: []
})
export class RedisModule {
  static register(options): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }
}
