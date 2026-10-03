import type { Trade } from './types'

export interface Stats {
  trades: number
  wins: number
  losses: number
  wash: number
  open: number
  netPnl: number
  winRate: number // 0..1 over closed trades
  avgWin: number
  avgLoss: number // negative or 0
  profitFactor: number | null // null when there are no losses
  expectancy: number
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** Statistics over closed trades. Breakeven (pnl === 0) trades count as wash. Open trades are only counted. */
export function computeStats(trades: Trade[]): Stats {
  const closed = trades.filter((t) => t.status === 'closed')
  const wins = closed.filter((t) => t.pnl > 0)
  const losses = closed.filter((t) => t.pnl < 0)
  const grossWin = sum(wins.map((t) => t.pnl))
  const grossLoss = sum(losses.map((t) => t.pnl))
  const netPnl = sum(closed.map((t) => t.pnl))
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    wash: closed.length - wins.length - losses.length,
    open: trades.length - closed.length,
    netPnl,
    winRate: closed.length ? wins.length / closed.length : 0,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss < 0 ? grossWin / -grossLoss : null,
    expectancy: closed.length ? netPnl / closed.length : 0,
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

/** Closed-trade P&L grouped by the day the trade was entered, sorted by day. */
export function dailyTotals(trades: Trade[]): DayTotal[] {
  const byDay = new Map<string, DayTotal>()
  for (const t of trades) {
    if (t.status !== 'closed') continue
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
      .filter((t) => t.status === 'closed')
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime))
      .map((t) => t.pnl),
  )

export const dayStreak = (trades: Trade[]): Streak => currentStreak(dailyTotals(trades).map((d) => d.pnl))
