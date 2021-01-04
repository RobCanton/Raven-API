import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TasksService } from './shared/tasks/tasks.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app
      .select(AppModule)
      .get(TasksService)
      .init();

  await app.listen(4012);
}
bootstrap();
