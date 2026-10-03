import { describe, expect, it } from 'vitest'
import { pnlFromPrices } from './contracts'
import { computeStats, currentStreak, dailyTotals, dayStreak, inRange, tradeStreak } from './stats'
import type { Trade } from './types'

// Midday local time, so the local calendar day is the same in any timezone.
const at = (month: number, day: number, hour = 12) => new Date(2026, month - 1, day, hour).toISOString()

let n = 0
const trade = (pnl: number, time: string, over: Partial<Trade> = {}): Trade => ({
  id: String(++n),
  symbol: 'MNQ',
  direction: 'long',
  qty: 1,
  entryPrice: null,
  exitPrice: null,
  entryTime: time,
  exitTime: null,
  status: 'closed',
  pnl,
  setup: null,
  tags: [],
  emotionBefore: null,
  emotionAfter: null,
  emotionTags: [],
  notes: null,
  ...over,
})

describe('computeStats', () => {
  // wins 100 + 50, losses -60 + -40, one wash, one open
  const trades = [
    trade(100, at(9, 7)),
    trade(50, at(9, 7)),
    trade(-60, at(9, 8)),
    trade(-40, at(9, 8)),
    trade(0, at(9, 9)),
    trade(999, at(9, 9), { status: 'open' }),
  ]
  const s = computeStats(trades)

  it('counts outcomes; open trades are excluded from results', () => {
    expect(s).toMatchObject({ trades: 6, wins: 2, losses: 2, wash: 1, open: 1 })
  })
  it('computes P&L figures', () => {
    expect(s.netPnl).toBe(50)
    expect(s.grossWin).toBe(150)
    expect(s.grossLoss).toBe(-100)
    expect(s.avgWin).toBe(75)
    expect(s.avgLoss).toBe(-50)
    expect(s.expectancy).toBe(10) // 50 / 5 closed
    expect(s.profitFactor).toBe(1.5) // 150 / 100
    expect(s.winRate).toBeCloseTo(0.4) // 2 of 5 closed
  })
  it('handles an empty list and no losses', () => {
    expect(computeStats([])).toMatchObject({ trades: 0, netPnl: 0, winRate: 0, profitFactor: null })
    expect(computeStats([trade(10, at(9, 7))]).profitFactor).toBeNull()
  })
})

describe('dailyTotals', () => {
  it('groups closed trades by day, sorted, ignoring open', () => {
    const days = dailyTotals([
      trade(-20, at(9, 8)),
      trade(30, at(9, 7)),
      trade(10, at(9, 7)),
      trade(500, at(9, 7), { status: 'open' }),
    ])
    expect(days).toEqual([
      { day: '2026-09-07', pnl: 40, trades: 2 },
      { day: '2026-09-08', pnl: -20, trades: 1 },
    ])
  })
})

describe('streaks', () => {
  it('currentStreak looks at the end and skips wash', () => {
    expect(currentStreak([])).toEqual({ type: 'none', length: 0 })
    expect(currentStreak([5, -1, -2, 0, -3])).toEqual({ type: 'loss', length: 3 })
    expect(currentStreak([-1, 2, 3])).toEqual({ type: 'win', length: 2 })
  })
  it('tradeStreak orders by time, dayStreak uses daily totals', () => {
    const ts = [trade(-5, at(9, 9)), trade(10, at(9, 7)), trade(20, at(9, 8)), trade(-1, at(9, 9, 15))]
    expect(tradeStreak(ts)).toEqual({ type: 'loss', length: 2 })
    expect(dayStreak(ts)).toEqual({ type: 'loss', length: 1 }) // 9/9 net -6 after wins on 9/7, 9/8
  })
})

describe('pnlFromPrices', () => {
  it('uses point values and direction', () => {
    expect(pnlFromPrices('MNQ', 'long', 2, 20000, 20010)).toBe(40) // 10 pts * $2 * 2
    expect(pnlFromPrices('ES', 'short', 1, 5000, 4995)).toBe(250) // 5 pts * $50
    expect(pnlFromPrices('ES', 'long', 1, 5000, 4995)).toBe(-250)
  })
  it('returns null for unknown symbol or missing price', () => {
    expect(pnlFromPrices('XYZ', 'long', 1, 1, 2)).toBeNull()
    expect(pnlFromPrices('ES', 'long', 1, null, 2)).toBeNull()
  })
})

describe('inRange', () => {
  const now = new Date(2026, 9, 3, 12)
  const ts = [trade(1, new Date(2026, 8, 30).toISOString()), trade(2, new Date(2026, 7, 1).toISOString()), trade(3, new Date(2026, 3, 20).toISOString())]
  it('filters by trailing days', () => {
    expect(inRange(ts, '30D', now)).toHaveLength(1)
    expect(inRange(ts, '90D', now)).toHaveLength(2)
    expect(inRange(ts, '180D', now)).toHaveLength(3)
    expect(inRange(ts, 'ALL', now)).toHaveLength(3)
  })
})
