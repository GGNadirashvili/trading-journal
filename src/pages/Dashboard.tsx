import { Flame } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProfitDonut, WinGauge, WinLossBar } from '../components/Gauges'
import PnlCalendar from '../components/PnlCalendar'
import StatCard from '../components/StatCard'
import { useI18n } from '../i18n/context'
import { money, pnlColor } from '../lib/format'
import { computeStats, dayStreak, inRange, tradeStreak, type Range, type Streak } from '../lib/stats'
import { useTrades } from '../lib/tradesContext'

const RANGES: Range[] = ['30D', '90D', '180D', 'ALL']

function StreakBadge({ s, unit }: { s: Streak; unit: string }) {
  const { t } = useI18n()
  if (s.type === 'none') return <div className="text-2xl font-semibold text-muted">-</div>
  return (
    <div className="flex items-center gap-2 text-2xl font-semibold">
      {unit}
      <Flame size={22} className={s.type === 'win' ? 'text-green' : 'text-loss'} />
      <span className={`rounded-full px-2 py-0.5 text-xs ${s.type === 'win' ? 'bg-green/20 text-green' : 'bg-loss/20 text-loss'}`}>
        {s.length} {s.type === 'win' ? t('dash.streakWin') : t('dash.streakLoss')}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { trades, loading, error } = useTrades()
  const { t, tn } = useI18n()
  const [range, setRange] = useState<Range>('ALL')

  const filtered = useMemo(() => inRange(trades, range), [trades, range])
  const s = useMemo(() => computeStats(filtered), [filtered])
  const tStreak = useMemo(() => tradeStreak(filtered), [filtered])
  const dStreak = useMemo(() => dayStreak(filtered), [filtered])

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error) return <p className="text-loss">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('dash.overview')}</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2 py-1 text-xs ${range === r ? 'bg-green text-black' : 'border border-line text-muted hover:text-green'}`}
            >
              {t(`range.${r}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t('dash.tradeWin')} className="sm:row-span-2">
          <WinGauge wins={s.wins} losses={s.losses} wash={s.wash} rate={s.winRate} />
        </StatCard>
        <StatCard title={t('dash.profitFactor')}>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold">{s.profitFactor === null ? '-' : s.profitFactor.toFixed(2)}</div>
            <ProfitDonut grossWin={s.grossWin} grossLoss={s.grossLoss} />
          </div>
        </StatCard>
        <StatCard title={t('dash.avgWinLoss')}>
          <div className="mb-2 text-2xl font-semibold">
            {s.avgLoss === 0 ? '-' : (s.avgWin / Math.abs(s.avgLoss)).toFixed(2)}
          </div>
          <WinLossBar avgWin={s.avgWin} avgLoss={s.avgLoss} />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-green">{money(s.avgWin)}</span>
            <span className="text-loss">{money(s.avgLoss)}</span>
          </div>
        </StatCard>
        <StatCard title={t('dash.netPnl')}>
          <div className={`text-2xl font-semibold ${pnlColor(s.netPnl)}`}>{money(s.netPnl)}</div>
          <div className="mt-1 text-xs text-muted">{tn('unit.trade', s.trades)}</div>
        </StatCard>
        <StatCard title={t('dash.dayStreak')}>
          <StreakBadge s={dStreak} unit={tn('unit.day', dStreak.length)} />
        </StatCard>
        <StatCard title={t('dash.tradeStreak')}>
          <StreakBadge s={tStreak} unit={tn('unit.trade', tStreak.length)} />
        </StatCard>
      </div>

      <PnlCalendar trades={trades} />
    </div>
  )
}
