import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

  private readonly logger = new Logger('Request');

  use(req: Request, res: Response, next: Function) {

    this.logger.log(`${req.method} ${req.originalUrl}`);
    next();
  }
}
