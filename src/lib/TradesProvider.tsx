import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from './tradesApi'
import { TradesContext, type TradesState } from './tradesContext'
import type { Trade } from './types'

const byEntryDesc = (a: Trade, b: Trade) => b.entryTime.localeCompare(a.entryTime)

export function TradesProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listTrades()
      .then((t) => setTrades(t.sort(byEntryDesc)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const add = useCallback(async (input: api.TradeInput) => {
    const t = await api.createTrade(input)
    setTrades((cur) => [...cur, t].sort(byEntryDesc))
    return t
  }, [])

  const addMany = useCallback(async (inputs: api.TradeInput[]) => {
    const created = await api.createTrades(inputs)
    setTrades((cur) => [...cur, ...created].sort(byEntryDesc))
  }, [])

  const update = useCallback(async (id: string, input: api.TradeInput) => {
    const t = await api.updateTrade(id, input)
    setTrades((cur) => cur.map((x) => (x.id === id ? t : x)).sort(byEntryDesc))
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.deleteTrade(id)
    setTrades((cur) => cur.filter((x) => x.id !== id))
  }, [])

  const value = useMemo<TradesState>(
    () => ({ trades, loading, error, add, addMany, update, remove }),
    [trades, loading, error, add, addMany, update, remove],
  )
  return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>
}
