import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Raven API v1 (RAVEN-NEST)';
  }
}
