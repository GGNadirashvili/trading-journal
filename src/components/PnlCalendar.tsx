import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildMonthGrid } from '../lib/calendar'
import { money, pnlColor } from '../lib/format'
import { dailyTotals, dayKey } from '../lib/stats'
import type { Trade } from '../lib/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const tint = (pnl: number, trades: number) =>
  trades === 0 ? 'bg-surface' : pnl > 0 ? 'bg-green/15 border-green/40' : pnl < 0 ? 'bg-loss/15 border-loss/40' : 'bg-surface-2'

// Open on the month of the most recent trade, so the latest week is visible right away.
function initialCursor(trades: Trade[]) {
  const latest = trades[0] // trades are sorted newest first
  const d = latest ? new Date(latest.entryTime) : new Date()
  return { year: d.getFullYear(), month: d.getMonth() }
}

const todayDayKey = () => dayKey(new Date().toISOString())
const thisYear = () => new Date().getFullYear()

export default function PnlCalendar({ trades }: { trades: Trade[] }) {
  const navigate = useNavigate()
  const [cursor, setCursor] = useState(() => initialCursor(trades))

  const totals = useMemo(() => dailyTotals(trades), [trades])
  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month, totals), [cursor, totals])
  const monthPnl = weeks.reduce((a, w) => a + w.pnl, 0)
  const [todayKey] = useState(todayDayKey)

  const shift = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const years = useMemo(() => {
    const ys = new Set([cursor.year, thisYear(), ...trades.map((t) => new Date(t.entryTime).getFullYear())])
    return [...ys].sort()
  }, [cursor.year, trades])

  const select = 'rounded-lg border border-line bg-bg px-2 py-1 text-sm text-fg'

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold">P&L Calendar</h2>
        <span className={`mr-2 text-sm font-semibold ${pnlColor(monthPnl)}`}>{money(monthPnl)}</span>
        <button onClick={() => shift(-1)} title="Previous month" className="rounded p-1 text-muted hover:text-green">
          <ChevronLeft size={18} />
        </button>
        <select className={select} value={cursor.month} onChange={(e) => setCursor({ ...cursor, month: Number(e.target.value) })}>
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select className={select} value={cursor.year} onChange={(e) => setCursor({ ...cursor, year: Number(e.target.value) })}>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <button onClick={() => shift(1)} title="Next month" className="rounded p-1 text-muted hover:text-green">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,1.2fr)] gap-1.5 text-center sm:gap-2">
        {[...WEEKDAYS, 'Weekly'].map((d) => (
          <div key={d} className="pb-1 text-xs text-muted sm:text-sm">
            {d}
          </div>
        ))}
        {weeks.map((w) => (
          <Week key={w.cells[0].key} week={w} todayKey={todayKey} onOpenDay={(k) => navigate(`/trades?date=${k}`)} />
        ))}
      </div>
    </div>
  )
}

function Week({ week, todayKey, onOpenDay }: { week: ReturnType<typeof buildMonthGrid>[number]; todayKey: string; onOpenDay: (key: string) => void }) {
  return (
    <>
      {week.cells.map((c) => {
        const clickable = c.inMonth && c.trades > 0
        return (
          <button
            key={c.key}
            disabled={!clickable}
            onClick={() => onOpenDay(c.key)}
            className={`flex min-h-16 min-w-0 flex-col overflow-hidden rounded-lg border p-1.5 text-left sm:min-h-20 ${
              c.inMonth ? tint(c.pnl, c.trades) : 'border-transparent opacity-30'
            } ${c.inMonth && c.trades === 0 ? 'border-line' : ''} ${c.inMonth && c.key === todayKey ? 'ring-1 ring-green' : ''} ${
              clickable ? 'cursor-pointer hover:brightness-125' : 'cursor-default'
            }`}
          >
            <span className="text-xs text-muted">{c.day}</span>
            {c.trades > 0 && (
              <span className="mt-auto">
                <span className={`block whitespace-nowrap text-[11px] font-semibold sm:text-xs xl:text-sm ${pnlColor(c.pnl)}`}>{money(c.pnl)}</span>
                <span className="block text-[10px] text-muted sm:text-xs">
                  {c.trades} {c.trades === 1 ? 'trade' : 'trades'}
                </span>
              </span>
            )}
          </button>
        )
      })}
      <div className="flex min-h-16 flex-col justify-center rounded-lg bg-surface-2 p-1.5 sm:min-h-20">
        <span className={`text-xs font-semibold sm:text-sm ${pnlColor(week.pnl)}`}>{money(week.pnl)}</span>
        <span className="text-[10px] text-muted sm:text-xs">
          {week.trades} {week.trades === 1 ? 'trade' : 'trades'}
        </span>
      </div>
    </>
  )
}

