import { Module, DynamicModule, Global } from '@nestjs/common';
import { IEXService } from './iex.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: []
})
export class IEXModule {
  static register(options): DynamicModule {
    return {
      module: IEXModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        IEXService,
      ],
      exports: [IEXService],
    };
  }
}
