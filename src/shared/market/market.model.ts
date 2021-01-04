import { PolygonService, PolygonStockDetails,
  PolygonTickerWrapper, PolygonTicker,
  MarketStatus, PolygonAggregateResponse } from '../polygon/polygon.service';

// MARKET
export enum MarketType {
  stocks = "stocks",
  forex = "forex",
  crypto = "crypto"
}

export interface TimeRange {
  start: number
  end: number
  offset: number
}

export namespace Stock {
  // STOCKS
  export interface Details {
    symbol: string
    name: string
    description: string
    shares: number
  }

  export interface Trade {
    price: number
    size: number
    exchange: number
    timestamp: number
  }

  export interface Quote {
    askprice: number
    asksize: number
    askechange: number
    bidprice: number
    bidsize: number
    bidexchange:number
    timestamp: number
  }

  export interface DailyStats {
    close: number
    high: number
    low: number
    open: number
    volume: number
  }

  export interface Snapshot {
    symbol: string
    details: Details
    day: DailyStats
    trades: Trade[]
    quotes: Quote[]
    previousClose: DailyStats
    intraday: AggregateResponse
  }

  export interface AggregateResponse extends PolygonAggregateResponse, TimeRange {}
}



// FOREX
export namespace Forex {
  export interface Details {
    ticker: string
    currency: string
    active: boolean
    attrs: {
      currencyName: string
      currency: string
      baseName: string
      base: string
    },
    objectID: string
    name: string
    market: string
    locale: string
    primaryExch: string
    updated: string
    url: string
  }

  export interface Quote {
    a: number
    b: number
    x: number
    t: number
  }
}

// CRYPTO
export namespace Crypto {
  export interface Details {
    ticker: string
    currency: string
    active: boolean
    attrs: {
      currencyName: string
      currency: string
      baseName: string
      base: string
    },
    objectID: string
    name: string
    market: string
    locale: string
    primaryExch: string
    updated: string
    url: string
  }
}
