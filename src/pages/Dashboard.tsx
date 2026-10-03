import { Flame } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProfitDonut, WinGauge, WinLossBar } from '../components/Gauges'
import PnlCalendar from '../components/PnlCalendar'
import StatCard from '../components/StatCard'
import { money, pnlColor } from '../lib/format'
import { computeStats, dayStreak, inRange, tradeStreak, type Range, type Streak } from '../lib/stats'
import { useTrades } from '../lib/tradesContext'

const RANGES: Range[] = ['30D', '90D', '180D', 'ALL']

function StreakBadge({ s, unit }: { s: Streak; unit: string }) {
  if (s.type === 'none') return <div className="text-2xl font-semibold text-muted">-</div>
  return (
    <div className="flex items-center gap-2 text-2xl font-semibold">
      {s.length} {unit}
      <Flame size={22} className={s.type === 'win' ? 'text-green' : 'text-loss'} />
      <span className={`rounded-full px-2 py-0.5 text-xs ${s.type === 'win' ? 'bg-green/20 text-green' : 'bg-loss/20 text-loss'}`}>
        {s.length} {s.type === 'win' ? 'W' : 'L'}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { trades, loading, error } = useTrades()
  const [range, setRange] = useState<Range>('ALL')

  const filtered = useMemo(() => inRange(trades, range), [trades, range])
  const s = useMemo(() => computeStats(filtered), [filtered])
  const tStreak = useMemo(() => tradeStreak(filtered), [filtered])
  const dStreak = useMemo(() => dayStreak(filtered), [filtered])

  if (loading) return <p className="text-muted">Loading…</p>
  if (error) return <p className="text-loss">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2 py-1 text-xs ${range === r ? 'bg-green text-black' : 'border border-line text-muted hover:text-green'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Trade Win" className="sm:row-span-2">
          <WinGauge wins={s.wins} losses={s.losses} wash={s.wash} rate={s.winRate} />
        </StatCard>
        <StatCard title="Profit Factor">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{s.profitFactor === null ? '-' : s.profitFactor.toFixed(2)}</div>
            <ProfitDonut grossWin={s.grossWin} grossLoss={s.grossLoss} />
          </div>
        </StatCard>
        <StatCard title="Avg Win / Loss Trade">
          <div className="mb-2 text-2xl font-semibold">
            {s.avgLoss === 0 ? '-' : (s.avgWin / Math.abs(s.avgLoss)).toFixed(2)}
          </div>
          <WinLossBar avgWin={s.avgWin} avgLoss={s.avgLoss} />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-green">{money(s.avgWin)}</span>
            <span className="text-loss">{money(s.avgLoss)}</span>
          </div>
        </StatCard>
        <StatCard title="Net P&L">
          <div className={`text-2xl font-semibold ${pnlColor(s.netPnl)}`}>{money(s.netPnl)}</div>
          <div className="mt-1 text-xs text-muted">{s.trades} trades</div>
        </StatCard>
        <StatCard title="Day Streak">
          <StreakBadge s={dStreak} unit={dStreak.length === 1 ? 'day' : 'days'} />
        </StatCard>
        <StatCard title="Trade Streak">
          <StreakBadge s={tStreak} unit={tStreak.length === 1 ? 'trade' : 'trades'} />
        </StatCard>
      </div>

      <PnlCalendar trades={trades} />
    </div>
  )
}
