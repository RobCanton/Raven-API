
export namespace Polygon {
  export interface StockSnapshot {
      day: {
        c: number
        h: number
        l: number
        o: number
        v: number
        vw: number
      }
      lastQuote: {
        P: number
        S: number
        p: number
        s: number
        t: number
      }
      lastTrade: {
        c: number[]
        i: string
        p: number
        s: number
        t: number
        x: number
        e: number
      }
      min: {
        av: number
        c: number
        h: number
        l: number
        o: number
        v: number
        vw: number
      }
      prevDay: {
        c: number
        h: number
        l: number
        o: number
        v: number
        vw: number
      }
      ticker: string
      todaysChange: number
      todaysChangePerc: number
      updated: number
  }

  export interface AggregateResponse {
    results: AggregateTick[]
  }

  export interface AggregateTick {
    T: string
    v: number
    o: number
    c: number
    h: number
    l: number
    t: number
    n: number
  }

  export namespace Crypto {

    export interface Trade {
      c: number[]
      i: string
      p: number
      s: number
      t: number
      x: number
    }

    export interface TradeFull {
      conditions: number[]
      exchange: number
      price: number
      size: number
      timestamp: number
    }

    export interface Snapshot {
        day: {
          c: number
          h: number
          l: number
          o: number
          v: number
          vw: number
        }
        lastTrade: Trade,
        min: {
          c: number
          h: number
          l: number
          o: number
          v: number
          vw: number
        }
        prevDay: {
          c: number
          h: number
          l: number
          o: number
          v: number
          vw: number
        }
        ticker: string
        todaysChange: number
        todaysChangePerc: number
        updated: number
    }
  }

  export namespace Forex {
    export interface Snapshot {
      last: {
        bid: number
        ask: number
        exchange: number
        timestamp: number
      }
      from: string
      to: string
      initialAmount: number
      converted: number
    }

    export interface QuoteResponse {
      last: Quote
      status: string
      symbol: string
    }

    export interface Quote {
      ask: number
      bid: number
      exchange: number
      timestamp: number
    }

    export interface PreviousCloseResponse {
      ticker: string
      status: string
      queryCount: number
      resultsCount: number
      adjusted: boolean
      results: PreviousClose[]
    }

    export interface PreviousClose {
      T: string
      v: number
      o: number
      c: number
      h: number
      l: number
      t: number
    }

  }



}
