import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './routes/admin/admin.module';
import { UserModule } from './routes/user/user.module';
import { ReferenceModule } from './routes/ref/reference.module';
import { NewsModule } from './routes/news/news.module';
import { SocialModule } from './routes/social/social.module';
import { RedisModule } from './shared/redis/redis.module';
import { FirebaseModule } from './shared/firebase/firebase.module';
import { PolygonModule } from './shared/polygon/polygon.module';
import { IEXModule } from './shared/iex/iex.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WatcherModule } from './shared/watcher/watcher.module';
import { AlgoliaModule } from './shared/algolia/algolia.module';
import { LoggerMiddleware } from './middleware/logger/logger.middleware';
import { TasksService } from './shared/tasks/tasks.service';
import { MarketService } from './shared/market/market.service';
import { AlertService } from './helpers/alert.service';
import { StockService } from './helpers/stock.service';
import { WatcherGateway } from './shared/watcher/watcher.gateway';


import * as serviceAccount from './service_key.json';

const firebase_security_params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url
}


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '_site'),
    }),
    ScheduleModule.forRoot(),
    RedisModule.register({
      url: "rediss://default:t6xury3q46xdy1qq@raven-redis-cluster-do-user-1543049-0.a.db.ondigitalocean.com:25061"
    }),
    FirebaseModule.register({
      security_params: firebase_security_params,
      databaseURL: "https://stock-raven.firebaseio.com/",
      storageBucket: "gs://stock-raven.appspot.com/"
    }),
    PolygonModule.register({
      api_key: '95Pvh13omJpeLWlxOpbpbW4BDOjaFzFn'
    }),
    IEXModule.register({
      api_key: 'pk_03e4439873e34bcc9aa48865912ad73d'
    }),
    AlgoliaModule.register({
      app_id: 'J0PSFDMNOG',
      api_key: '8f13a38771fa3311cf44714087746885'
    }),
    WatcherModule.register({
      api_key: 'P4GNjFy1Uk0a21ZUhjkNF227Kxoud_57KGRTV4'
    }),
    AdminModule,
    UserModule,
    ReferenceModule,
    NewsModule,
    SocialModule,
  ],
  controllers: [],
  providers: [TasksService, AlertService, WatcherGateway, StockService, MarketService],
})
export class AppModule  implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
