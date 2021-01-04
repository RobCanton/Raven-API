import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { MarketService } from '../../market/market.service';
import { RedisService } from '../../redis/redis.service';
import { WatcherDelegate } from '../watcher.service';
import * as Models from '../watcher.model';
import * as WebSocket from "ws"

export abstract class Watcher {

    protected marketType: MarketType;
    protected delegate: WatcherDelegate;
    protected logger: Logger;

    private ws;
    private apiKey;
    private socketURL;
    private isConnectionAlive = false;

    constructor(
      marketType: MarketType,
      delegate: WatcherDelegate,
      apiKey: string,
      protected readonly marketService: MarketService,
      protected readonly redisService: RedisService
    ) {
      this.delegate = delegate;
      this.marketType = marketType;
      this.logger = new Logger(`Watcher ${marketType}`);
      this.socketURL = `wss://socket.polygon.io/${marketType}`;

      this.apiKey = apiKey;

      // Connection Opened:
      this.websocketConnect();
      // /this.websocketOnMessage();

    }

    websocketConnect() {
      this.ws = new WebSocket(this.socketURL);
      this.ws.on('open', async () => {
        this.isConnectionAlive = true;
        this.logger.log(`Connected to ${this.socketURL}`);

        this.ws.send(`{"action":"auth","params":"${this.apiKey}"}`);

        let results = await this.redisService.smembers(`${this.marketType}_watchlist`) as string[];
        results.forEach( symbol => {
          this.subscribeTo(symbol);
        })
      })

      this.ws.on('pong', () => {
        if (!this.isConnectionAlive) {
          this.logger.log(`Connection is dead: ${this.isConnectionAlive}`);
        }
      })

      this.ws.on('close', async () => {
        this.isConnectionAlive = false;
        if (this.logger) {
          this.logger.log(`Disconnected from ${this.socketURL}`);
        }
        this.websocketConnect();
      });

      this.ws.on('message', (data) => {
        data = JSON.parse(data)
        data.map((msg) => {
          if (msg.ev === 'status') {
            this.logger.log(`Message [${msg.message}]`);
            return;
          }

          this.handleMessage(msg as Models.Message);
        })
      })

    }

    ping() {
      if (this.isConnectionAlive) {
        this.ws.ping();
      }
    }

    sendWebsocketMessage(message:string) {
      this.ws.send(message);
    }

    abstract nextTick():void

    abstract handleMessage(message: any): void

    abstract subscribeTo(symbol: string): void

    abstract unsubscribeFrom(symbol: string): void
}
