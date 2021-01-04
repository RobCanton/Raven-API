import { Module, MiddlewareConsumer } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { TwitterModule } from '../../shared/twitter/twitter.module';


@Module({
  imports: [
    TwitterModule.register({
      consumer_key: "RYvnwk6jjoyN5xKIlKM3fqcCf",
      consumer_secret: "VxBrbVMQyFsWS4vWJ4o4SbtCZUgNsJiLCUfb4P1jO4fKyUS4LR"
    }),
  ],
  controllers: [SocialController],
  providers: [SocialService]
})
export class SocialModule {

}
