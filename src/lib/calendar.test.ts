import { describe, expect, it } from 'vitest'
import { buildMonthGrid } from './calendar'

describe('buildMonthGrid', () => {
  // October 2026 starts on a Thursday and has 31 days -> 5 weeks.
  const weeks = buildMonthGrid(2026, 9, [
    { day: '2026-10-01', pnl: 100, trades: 2 },
    { day: '2026-10-02', pnl: -40, trades: 1 },
    { day: '2026-10-05', pnl: 10, trades: 1 },
    { day: '2026-09-30', pnl: 999, trades: 9 }, // other month: must be ignored
  ])

  it('lays out Sunday-first weeks with filler days', () => {
    expect(weeks).toHaveLength(5)
    expect(weeks[0].cells.map((c) => c.day)).toEqual([27, 28, 29, 30, 1, 2, 3])
    expect(weeks[0].cells.map((c) => c.inMonth)).toEqual([false, false, false, false, true, true, true])
    expect(weeks[4].cells.at(-1)?.day).toBe(31) // Oct 31 is a Saturday
  })
  it('sums weekly totals over in-month days only', () => {
    expect(weeks[0]).toMatchObject({ pnl: 60, trades: 3 })
    expect(weeks[1]).toMatchObject({ pnl: 10, trades: 1 })
    expect(weeks[2]).toMatchObject({ pnl: 0, trades: 0 })
  })
  it('handles a month that fits exactly in 4 weeks', () => {
    expect(buildMonthGrid(2026, 1, [])).toHaveLength(4) // Feb 2026 starts on Sunday, 28 days
  })
})
