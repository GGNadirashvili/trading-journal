export type Direction = 'long' | 'short'
export type TradeStatus = 'open' | 'closed'

export interface Trade {
  id: string
  symbol: string
  direction: Direction
  qty: number
  entryPrice: number | null
  exitPrice: number | null
  entryTime: string // ISO timestamp
  exitTime: string | null
  status: TradeStatus
  pnl: number // net USD
  setup: string | null
  tags: string[]
  emotionBefore: string | null
  emotionAfter: string | null
  emotionTags: string[]
  notes: string | null
}
