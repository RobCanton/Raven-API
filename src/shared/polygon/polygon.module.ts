import { Module, DynamicModule, Global, HttpModule } from '@nestjs/common';
import { PolygonService } from './polygon.service';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: []
})
export class PolygonModule {
  static register(options): DynamicModule {
    return {
      module: PolygonModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        PolygonService,
      ],
      exports: [PolygonService],
    };
  }
}
