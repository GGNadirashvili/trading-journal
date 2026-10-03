import type { Session } from './sessions'

export type Direction = 'long' | 'short'

export interface Trade {
  id: string
  symbol: string
  direction: Direction
  qty: number
  entryPrice: number | null
  exitPrice: number | null
  entryTime: string // ISO timestamp
  exitTime: string | null
  pnl: number // net USD
  setup: string | null
  tags: string[]
  emotionBefore: string | null
  emotionAfter: string | null
  emotionTags: string[]
  notes: string | null
  /** Null only for trades saved before sessions existed. */
  session: Session | null
  /** The prop-firm account this trade belongs to; null for trades with no account. */
  accountId: string | null
}
