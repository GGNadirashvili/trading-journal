import type { DayTotal } from './stats'

export interface CalendarCell {
  key: string // YYYY-MM-DD
  day: number
  inMonth: boolean
  pnl: number
  trades: number
}

export interface CalendarWeek {
  cells: CalendarCell[] // 7 cells, Sunday first
  pnl: number // sum of in-month days only
  trades: number
}

const pad = (n: number) => String(n).padStart(2, '0')
export const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Sunday-first month grid. `month` is 0-11. Days from neighbouring months are filler: no data, not in weekly totals. */
export function buildMonthGrid(year: number, month: number, totals: DayTotal[]): CalendarWeek[] {
  const byDay = new Map(totals.map((t) => [t.day, t]))
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil((first.getDay() + daysInMonth) / 7)

  const weeks: CalendarWeek[] = []
  for (let w = 0; w < weekCount; w++) {
    const cells: CalendarCell[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i)
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate())
      const inMonth = d.getMonth() === month
      const t = inMonth ? byDay.get(key) : undefined
      cells.push({ key, day: d.getDate(), inMonth, pnl: t?.pnl ?? 0, trades: t?.trades ?? 0 })
    }
    weeks.push({
      cells,
      pnl: cells.reduce((a, c) => a + c.pnl, 0),
      trades: cells.reduce((a, c) => a + c.trades, 0),
    })
  }
  return weeks
}
