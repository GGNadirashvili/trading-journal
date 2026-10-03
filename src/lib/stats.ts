import type { Trade } from './types'

export interface Stats {
  trades: number
  wins: number
  losses: number
  wash: number
  netPnl: number
  grossWin: number
  grossLoss: number // negative or 0
  winRate: number // 0..1 over closed trades
  avgWin: number
  avgLoss: number // negative or 0
  profitFactor: number | null // null when there are no losses
  expectancy: number
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Trade statistics. Breakeven (pnl === 0) trades count as wash. */
export function computeStats(trades: Trade[]): Stats {
  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl < 0)
  const grossWin = sum(wins.map((t) => t.pnl))
  const grossLoss = sum(losses.map((t) => t.pnl))
  const netPnl = sum(trades.map((t) => t.pnl))
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    wash: trades.length - wins.length - losses.length,
    netPnl,
    grossWin,
    grossLoss,
    winRate: trades.length ? wins.length / trades.length : 0,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss < 0 ? grossWin / -grossLoss : null,
    expectancy: trades.length ? netPnl / trades.length : 0,
  }
}

/** Local calendar day (YYYY-MM-DD) of a timestamp. */
export function dayKey(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export interface DayTotal {
  day: string
  pnl: number
  trades: number
}

/** P&L grouped by the day the trade was entered, sorted by day. */
export function dailyTotals(trades: Trade[]): DayTotal[] {
  const byDay = new Map<string, DayTotal>()
  for (const t of trades) {
    const day = dayKey(t.entryTime)
    const cur = byDay.get(day) ?? { day, pnl: 0, trades: 0 }
    cur.pnl += t.pnl
    cur.trades += 1
    byDay.set(day, cur)
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
}

export interface Streak {
  type: 'win' | 'loss' | 'none'
  length: number
}

/** Current streak at the end of a chronologically ordered list of results. Wash results are skipped. */
export function currentStreak(results: number[]): Streak {
  let type: Streak['type'] = 'none'
  let length = 0
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i]
    if (r === 0) continue
    const t = r > 0 ? 'win' : 'loss'
    if (type === 'none') type = t
    if (t !== type) break
    length++
  }
  return { type, length }
}

export const tradeStreak = (trades: Trade[]): Streak =>
  currentStreak(
    trades
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime))
      .map((t) => t.pnl),
  )

export const dayStreak = (trades: Trade[]): Streak => currentStreak(dailyTotals(trades).map((d) => d.pnl))

export type Range = '30D' | '90D' | '180D' | 'ALL'

const RANGE_DAYS: Record<Exclude<Range, 'ALL'>, number> = { '30D': 30, '90D': 90, '180D': 180 }

/** Trades entered within the last N days up to `now`. ALL returns everything. */
export function inRange(trades: Trade[], range: Range, now: Date = new Date()): Trade[] {
  if (range === 'ALL') return trades
  const from = now.getTime() - RANGE_DAYS[range] * 86_400_000
  return trades.filter((t) => new Date(t.entryTime).getTime() >= from)
}
