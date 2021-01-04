export interface Message {
  ev: string
}

export interface ClientMessage {
  event: string
  room: string
  data: any
}


// STOCKS
export interface StockMessage {
  ev: string
  sym: string
}

export interface StockTradeMessage extends Message {
  sym: string
  x: number
  i: string
  z: number
  p: number
  s: number
  c: number[]
  t: number
};

export interface StockAggregateMessage extends Message {
  sym: string
  v: number
  av: number
  op: number
  vw: number
  o: number
  c: number
  h: number
  l: number
  a: number
  s: number
  e: number
}

export interface StockQuoteMessage extends Message {
  sym: string
  bx: string
  bp: number
  bs: number
  ax: string
  ap: number
  as: number
  c: number
  t: number
};

// FOREX
export interface ForexQuoteMessage extends Message {
  p: string
  x: string
  a: number
  b: number
  t: number
}

export interface ForexAggregateMessage extends Message {
  pair: string
  o: number
  c: number
  h: number
  l: number
  v: number
  s: number
}

// CRYPTO
export interface CryptoQuoteMessage extends Message {
  pair: string
  lp: number
  ls: number
  bp: number
  bs: number
  ap: number
  as: number
  t: number
  x: number
  r: number
}

export interface CryptoTradeMessage extends Message {
  pair: string
  p: number
  t: number
  s: number
  c: number[]
  i: string
  x: number
  r: number
}

export interface CryptoAggregateMessage extends Message {
  pair: string
  o: number
  ox: number
  h: number
  hx: number
  l: number
  lx: number
  c: number
  cx: number
  v: number
  s: number
  e: number
}
