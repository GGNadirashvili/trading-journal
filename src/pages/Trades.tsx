import { useTrades } from '../lib/tradesContext'

export default function Trades() {
  const { trades, loading, error } = useTrades()
  if (loading) return <p className="text-muted">Loading…</p>
  if (error) return <p className="text-loss">{error}</p>
  return <h1 className="text-xl font-semibold">Trades ({trades.length})</h1>
}
