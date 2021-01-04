import { Module, DynamicModule, Global, HttpModule } from '@nestjs/common';
import { AlgoliaService } from './algolia.service';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: []
})
export class AlgoliaModule {
  static register(options): DynamicModule {
    return {
      module: AlgoliaModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        AlgoliaService,
      ],
      exports: [AlgoliaService],
    };
  }
}
