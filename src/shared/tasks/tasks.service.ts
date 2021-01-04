import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout, NestSchedule, defaults } from '@proscom/nestjs-schedule';
import { RedisService } from '../redis/redis.service';
import { AlertService, Alert } from '../../helpers/alert.service';
import { StockService } from '../../helpers/stock.service';
import { WatcherGateway } from '../watcher/watcher.gateway';
import { WatcherService } from '../watcher/watcher.service';
import { MarketType } from '../market/market.model';
import { MarketService } from '../market/market.service';
import { IEXService, IEXStockQuote } from '../iex/iex.service';


@Injectable()
export class TasksService extends NestSchedule {

  private readonly logger = new Logger('TasksService');

  constructor(
    private readonly redisService: RedisService,
    private readonly alertService: AlertService,
    private readonly stockService: StockService,
    private readonly iexService: IEXService,
    private readonly watcherGateway: WatcherGateway,
    private readonly watcherService: WatcherService,
    private readonly marketService: MarketService
  ) {
    super();

    this.alertsResetter();
    this.checkMarketStatus();
  }

  // Called every 10 seconds
  async resetAlert(alertID: string) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;

    if (!alertStr) {
      await this.redisService.zrem(`fired_alerts`, alertID);
      return;
    }
    let alert = JSON.parse(alertStr) as Alert;
    this.logger.log(`Reset Alert ${alertID}`);

    let marketType:MarketType = this.marketService.typeForSymbol(alert.s);
    let alertSuffix = this.alertService.alertSuffix(alert.t, alert.c);
    //console.log("reset suffix: ", alertSuffix);
    if (!alertSuffix) {
      return;
    }

    await this.redisService.zadd(`alerts_${marketType}_${alertSuffix}:${alert.ss}`, alert.v, alertID);
    await this.redisService.zrem(`fired_alerts`, alertID);
    return;

  }

  @Interval(5000)
  async alertsResetter() {
    //this.logger.log(`Check alerts...`);
    let alertsForReset = await this.redisService.zrangebyscore(`fired_alerts`, 0, Date.now()) as Array<string>;
    //this.logger.log(`alertsForReset: %j, alertsForReset);
    var promises = [];
    alertsForReset.forEach( alertID => {
      promises.push(this.resetAlert(alertID));
    })

    await Promise.all(promises);

  }

  @Interval(30000)
  watcherKeepAlive() {
    this.watcherService.keepAlive();
  }

  @Interval(1000)
  watcherNextTick() {
    this.watcherService.nextTick();
  }

  @Cron('0 * 1-21 * * 0-5', {
    tz: 'America/New_York',
  })
  async checkMarketStatus() {
    let status = await this.stockService.marketStatus() as string;
    this.logger.log(`Market status: ${status}`);
    await this.redisService.set('market-status', status);
    this.watcherGateway.sendMarketStatus(status);
  }

  // @Cron('0 */15 * * * *', {
  //   tz: 'America/New_York'
  // })
  async updateMostActiveStocks() {

    let mostActiveStocksKey = 'list:mostactivestocks';
    await this.watcherService.unwatchList(mostActiveStocksKey);

    let mostActiveStocks = await this.iexService.listMostActive() as IEXStockQuote[];
    var mostActiveStockSymbols:string[] = []//['AAPL', 'AMZN', 'ROKU', 'NFLX'];
    mostActiveStocks.forEach( stock => {
      mostActiveStockSymbols.push(stock.symbol);
    })

    let mostActiveStocksPE = await this.stockService.polygonEnabledSymbols(mostActiveStockSymbols);
    this.logger.log(`mostActiveStocks: ${mostActiveStocksPE}`);

    await this.redisService.rpushMultiple(mostActiveStocksKey, mostActiveStocksPE);

    var promises = [];
    mostActiveStocksPE.forEach( symbol => {
      let marketType = this.marketService.typeForSymbol(symbol);
      let addWatcher = this.redisService.hset(`${marketType}_watchers:${symbol}`, mostActiveStocksKey, true);
      let addToWatchlist = this.redisService.sadd(`${marketType}_watchlist`, symbol);

      promises.push(addWatcher);
      promises.push(addToWatchlist);

    })

    await Promise.all(promises);

    mostActiveStocksPE.forEach( symbol => {
      this.watcherService.subscribeTo(symbol, MarketType.stocks);
    })

    //this.redisService.publish('watchlist:add', symbol);


  }



}
