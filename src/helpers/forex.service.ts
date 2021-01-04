import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RedisService } from '../shared/redis/redis.service';
import { PolygonService } from '../shared/polygon/polygon.service';
import { IEXService } from '../shared/iex/iex.service';
import * as promiseReflect from 'promise-reflect';
import * as moment from 'moment';
import 'moment-timezone';

export interface PromiseReflectResult<T> {
  status: string
  data: T
}


@Injectable()
export class ForexService {

  private logger: Logger = new Logger('ForexService');

  constructor(
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService
  ) {}

}
