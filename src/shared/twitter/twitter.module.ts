import { Module, DynamicModule, Global, HttpModule } from '@nestjs/common';
import { TwitterService } from './twitter.service';


@Module({
  imports: [HttpModule],
  controllers: [],
  providers: []
})
export class TwitterModule {
  static register(options): DynamicModule {
    return {
      module: TwitterModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        TwitterService,
      ],
      exports: [TwitterService],
    };
  }
}
