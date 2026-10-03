import { describe, expect, it } from 'vitest'
import { byEmotion, byHour, bySymbol, byWeekday, equityCurve } from './reports'
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

const trades = [
  trade(100, 7, 9, { emotionTags: ['calm'] }),
  trade(-50, 7, 10, { symbol: 'ES', emotionTags: ['fomo', 'anxious'] }),
  trade(-150, 8, 9, { emotionTags: ['fomo'] }),
  trade(999, 8, 9, { status: 'open' }),
]

describe('reports', () => {
  it('bySymbol sums and counts closed trades only', () => {
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
