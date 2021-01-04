import { PolygonService, PolygonStockDetails,
  PolygonTickerWrapper, PolygonTicker,
  MarketStatus, PolygonAggregateResponse } from '../shared/polygon/polygon.service';

export interface StockDetails {
  symbol: string
  name: string
  description: string
  shares: number
}

export interface StockTrade {
  price: number
  size: number
  exchange: number
  timestamp: number
}

export interface StockQuote {
  askprice: number
  asksize: number
  askechange: number
  bidprice: number
  bidsize: number
  bidexchange:number
  timestamp: number
}

export interface StockDailyStats {
  close: number
  high: number
  low: number
  open: number
  volume: number
}

export interface StockSnapshot {
  symbol: string
  details: StockDetails
  day: StockDailyStats
  trades: StockTrade[]
  quotes: StockQuote[]
  previousClose: StockDailyStats
  intraday: StockAggregateResponse
}

export interface TimeRange {
  start: number
  end: number
  offset: number
}

export interface StockAggregateResponse extends PolygonAggregateResponse, TimeRange {}
