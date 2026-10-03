import { describe, expect, it } from 'vitest'
import { byEmotion, byHour, bySession, bySymbol, byWeekday, equityCurve } from './reports'
import type { Trade } from './types'

let n = 0
// 2026-09-07 is a Monday.
const trade = (pnl: number, day: number, hour: number, over: Partial<Trade> = {}): Trade => ({
  id: String(++n),
  symbol: 'MNQ',
  direction: 'long',
  qty: 1,
  entryPrice: null,
  exitPrice: null,
  entryTime: new Date(2026, 8, day, hour, 15).toISOString(),
  exitTime: null,
  pnl,
  setup: null,
  tags: [],
  emotionBefore: null,
  emotionAfter: null,
  emotionTags: [],
  notes: null,
  session: null,
  ...over,
})

const trades = [
  trade(100, 7, 9, { emotionTags: ['calm'] }),
  trade(-50, 7, 10, { symbol: 'ES', emotionTags: ['fomo', 'anxious'] }),
  trade(-150, 8, 9, { emotionTags: ['fomo'] }),
]

describe('bySession', () => {
  const t = (pnl: number, session: Trade['session']) => trade(pnl, 7, 9, { session })
  const list = [t(100, 'ny_am'), t(-40, 'ny_am'), t(60, 'ny_am'), t(-20, 'london'), t(0, 'london'), t(30, 'asia'), t(10, null), t(-5, null)]
  const rows = bySession(list)
  it('lists sessions in the fixed order, skips empty ones and puts unclassified trades last', () => {
    expect(rows.map((r) => r.label)).toEqual(['asia', 'london', 'ny_am', 'none'])
  })
  it('counts trades, wins and win rate per session (a breakeven trade is not a win)', () => {
    const am = rows.find((r) => r.label === 'ny_am')!
    expect(am).toMatchObject({ trades: 3, wins: 2, pnl: 120, avgPnl: 40 })
    expect(am.winRate).toBeCloseTo(2 / 3)
    const london = rows.find((r) => r.label === 'london')!
    expect(london).toMatchObject({ trades: 2, wins: 0, winRate: 0, pnl: -20 })
    expect(rows.find((r) => r.label === 'asia')).toMatchObject({ trades: 1, wins: 1, winRate: 1 })
  })
  it('groups trades without a session as none', () => {
    expect(rows.find((r) => r.label === 'none')).toMatchObject({ trades: 2, wins: 1, pnl: 5 })
  })
  it('returns nothing for no trades', () => {
    expect(bySession([])).toEqual([])
  })
})

describe('reports', () => {
  it('bySymbol sums and counts trades', () => {
    expect(bySymbol(trades)).toEqual([
      expect.objectContaining({ label: 'ES', pnl: -50, trades: 1, wins: 0 }),
      expect.objectContaining({ label: 'MNQ', pnl: -50, trades: 2, wins: 1, winRate: 0.5, avgPnl: -25 }),
    ])
  })
  it('byWeekday orders Mon-first and skips empty days', () => {
    expect(byWeekday(trades).map((b) => [b.label, b.pnl])).toEqual([
      ['Mon', 50],
      ['Tue', -150],
    ])
  })
  it('byHour groups by entry hour', () => {
    expect(byHour(trades).map((b) => [b.label, b.trades])).toEqual([
      ['09:00', 2],
      ['10:00', 1],
    ])
  })
  it('byEmotion counts a multi-tag trade in each tag, worst average first', () => {
    const e = byEmotion(trades)
    expect(e.map((b) => b.label)).toEqual(['fomo', 'anxious', 'calm'])
    expect(e[0]).toMatchObject({ trades: 2, pnl: -200, avgPnl: -100 })
  })
  it('equityCurve accumulates per day', () => {
    expect(equityCurve(trades)).toEqual([
      { day: '2026-09-07', daily: 50, equity: 50 },
      { day: '2026-09-08', daily: -150, equity: -100 },
    ])
  })
})
