import { Module, DynamicModule, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  controllers: [],
  providers: []
})
export class FirebaseModule {
  static register(options): DynamicModule {
    return {
      module: FirebaseModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        FirebaseService,
      ],
      exports: [FirebaseService],
    };
  }
}
