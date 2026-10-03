import { dayKey } from './stats'
import type { Trade } from './types'

export interface Bucket {
  label: string
  pnl: number
  trades: number
  wins: number
  winRate: number // 0..1
  avgPnl: number
}

function toBucket(label: string, ts: Trade[]): Bucket {
  const pnl = ts.reduce((a, t) => a + t.pnl, 0)
  const wins = ts.filter((t) => t.pnl > 0).length
  return { label, pnl, trades: ts.length, wins, winRate: ts.length ? wins / ts.length : 0, avgPnl: ts.length ? pnl / ts.length : 0 }
}

/** Group trades by a key. Buckets come back in the order given by `order`, or sorted by label. */
function groupBy(trades: Trade[], keys: (t: Trade) => string[], order?: string[]): Bucket[] {
  const map = new Map<string, Trade[]>()
  for (const t of trades) {
    for (const k of keys(t)) map.set(k, [...(map.get(k) ?? []), t])
  }
  const labels = order ? order.filter((l) => map.has(l)) : [...map.keys()].sort()
  return labels.map((l) => toBucket(l, map.get(l)!))
}

export const bySymbol = (trades: Trade[]) => groupBy(trades, (t) => [t.symbol])

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const byWeekday = (trades: Trade[]) =>
  groupBy(trades, (t) => [WEEKDAYS[new Date(t.entryTime).getDay()]], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`
export const byHour = (trades: Trade[]) =>
  groupBy(trades, (t) => [hourLabel(new Date(t.entryTime).getHours())])

/** A trade with several emotion tags counts once in each of them; trades with none go under "(none)". */
export const byEmotion = (trades: Trade[]) =>
  groupBy(trades, (t) => (t.emotionTags.length ? t.emotionTags : ['(none)'])).sort((a, b) => a.avgPnl - b.avgPnl)

export interface EquityPoint {
  day: string
  daily: number
  equity: number
}

/** Cumulative P&L at the end of each trading day. */
export function equityCurve(trades: Trade[]): EquityPoint[] {
  const byDay = new Map<string, number>()
  for (const t of trades) {
    const k = dayKey(t.entryTime)
    byDay.set(k, (byDay.get(k) ?? 0) + t.pnl)
  }
  let equity = 0
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, daily]) => ({ day, daily, equity: (equity += daily) }))
}
