import { createContext, useContext } from 'react'
import type { TradeInput } from './tradesApi'
import type { Trade } from './types'

export interface TradesState {
  trades: Trade[]
  loading: boolean
  error: string | null
  add: (t: TradeInput) => Promise<Trade>
  update: (id: string, t: TradeInput) => Promise<void>
  remove: (id: string) => Promise<void>
  /** Gives every trade without an account to this account, then reloads the list. Returns how many changed. */
  assignUnassigned: (accountId: string) => Promise<number>
}

export const TradesContext = createContext<TradesState | null>(null)

export function useTrades(): TradesState {
  const ctx = useContext(TradesContext)
  if (!ctx) throw new Error('useTrades must be used inside TradesProvider')
  return ctx
}
