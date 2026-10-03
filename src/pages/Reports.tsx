import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useI18n } from '../i18n/context'
import { weekdayNames } from '../i18n/dates'
import { money, pnlColor } from '../lib/format'
import { byEmotion, byHour, bySession, bySymbol, byWeekday, equityCurve, type Bucket } from '../lib/reports'
import { inRange, type Range } from '../lib/stats'
import { useAccounts } from '../lib/accountsContext'
import { useSettings } from '../lib/settingsContext'
import { useTrades } from '../lib/tradesContext'

const RANGES: Range[] = ['30D', '90D', '180D', 'ALL']
const GREEN = '#22e55c'
const RED = '#ff4d5e'
const MUTED = '#a9b8ad'
const LINE = '#2a3a2c'

const usd = (v: number) => `${v < 0 ? '-' : ''}$${Math.abs(v)}`
const tooltipStyle = { background: '#0a0f0a', border: `1px solid ${LINE}`, borderRadius: 8, color: '#f5f7f5' }
const axis = { stroke: MUTED, fontSize: 12, tickLine: false, axisLine: { stroke: LINE } } as const

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-4 ${className}`}>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Empty() {
  const { t } = useI18n()
  return <p className="py-10 text-center text-sm text-muted">{t('reports.noData')}</p>
}

function PnlBars({ data }: { data: Bucket[] }) {
  const { t, tn } = useI18n()
  if (!data.length) return <Empty />
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} tickFormatter={usd} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          formatter={(v) => [money(Number(v)), t('reports.pnl')]}
          labelFormatter={(l, p) => `${l} (${tn('unit.trade', p[0]?.payload.trades ?? 0)})`}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.pnl >= 0 ? GREEN : RED} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Reports() {
  const { loading, error } = useTrades()
  const { scopedTrades: trades } = useAccounts()
  const { t, locale } = useI18n()
  const { label } = useSettings()
  const [range, setRange] = useState<Range>('ALL')
  const filtered = useMemo(() => inRange(trades, range), [trades, range])

  const equity = useMemo(() => equityCurve(filtered), [filtered])
  const symbol = useMemo(() => bySymbol(filtered), [filtered])
  // The weekday buckets are keyed by English day names; show them in the current language.
  const weekday = useMemo(() => {
    const names = weekdayNames(locale)
    const index = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return byWeekday(filtered).map((b) => ({ ...b, label: names[index.indexOf(b.label)] ?? b.label }))
  }, [filtered, locale])
  const hour = useMemo(() => byHour(filtered), [filtered])
  const sessions = useMemo(
    () =>
      bySession(filtered).map((b) => ({
        ...b,
        label: t(`session.${b.label as 'none'}`),
        rate: Math.round(b.winRate * 100),
      })),
    [filtered, t],
  )
  const emotion = useMemo(() => byEmotion(filtered), [filtered])

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error) return <p className="text-loss">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('reports.title')}</h1>
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

      <Card title={t('reports.equity')}>
        {equity.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={equity}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey="day" {...axis} />
              <YAxis {...axis} tickFormatter={usd} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [money(Number(v)), name === 'equity' ? t('reports.cumulative') : t('reports.day')]}
              />
              <Line type="monotone" dataKey="equity" stroke={GREEN} strokeWidth={2} dot={{ r: 3, fill: GREEN }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('reports.bySymbol')}>
          <PnlBars data={symbol} />
        </Card>
        <Card title={t('reports.byWeekday')}>
          <PnlBars data={weekday} />
        </Card>
        <Card title={t('reports.byHour')}>
          <PnlBars data={hour} />
        </Card>
        <Card title={t('reports.sessions')} className="lg:col-span-2">
          {sessions.length ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sessions} margin={{ top: 18 }}>
                  <CartesianGrid stroke={LINE} vertical={false} />
                  <XAxis dataKey="label" {...axis} interval={0} />
                  <YAxis {...axis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(_v, _n, item) => [t('reports.winRateTip', { rate: item.payload.rate, wins: item.payload.wins, trades: item.payload.trades }), t('reports.col.winRate')]}
                  />
                  <ReferenceLine y={50} stroke={MUTED} strokeDasharray="4 4" />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {sessions.map((d) => (
                      <Cell key={d.label} fill={d.rate >= 50 ? GREEN : RED} />
                    ))}
                    <LabelList dataKey="rate" position="top" formatter={(v) => `${v}%`} fill="#f5f7f5" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <table className="w-full self-start text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="pb-2">{t('reports.col.session')}</th>
                    <th className="pb-2">{t('reports.col.trades')}</th>
                    <th className="pb-2">{t('reports.col.winRate')}</th>
                    <th className="pb-2">{t('reports.col.avg')}</th>
                    <th className="pb-2">{t('reports.col.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((b) => (
                    <tr key={b.label} className="border-t border-line">
                      <td className="py-2 font-medium">{b.label}</td>
                      <td>{b.trades}</td>
                      <td className={b.rate >= 50 ? 'text-green' : 'text-loss'}>
                        {b.rate}% <span className="text-xs text-muted">({b.wins}/{b.trades})</span>
                      </td>
                      <td className={pnlColor(b.avgPnl)}>{money(b.avgPnl)}</td>
                      <td className={pnlColor(b.pnl)}>{money(b.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted">{t('reports.sessionNote')}</p>
        </Card>
        <Card title={t('reports.emotions')}>
          {emotion.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2">{t('reports.col.emotion')}</th>
                  <th className="pb-2">{t('reports.col.trades')}</th>
                  <th className="pb-2">{t('reports.col.winRate')}</th>
                  <th className="pb-2">{t('reports.col.avg')}</th>
                  <th className="pb-2">{t('reports.col.total')}</th>
                </tr>
              </thead>
              <tbody>
                {emotion.map((b) => (
                  <tr key={b.label} className="border-t border-line">
                    <td className="py-2 font-medium">{b.label === '(none)' ? t('reports.none') : label('emotion', b.label)}</td>
                    <td>{b.trades}</td>
                    <td>{(b.winRate * 100).toFixed(0)}%</td>
                    <td className={pnlColor(b.avgPnl)}>{money(b.avgPnl)}</td>
                    <td className={pnlColor(b.pnl)}>{money(b.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted">{t('reports.emotionNote')}</p>
        </Card>
      </div>
    </div>
  )
}
