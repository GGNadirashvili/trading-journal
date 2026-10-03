import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link, useParams } from 'react-router-dom'
import AccountCard from '../components/AccountCard'
import { useI18n } from '../i18n/context'
import { useAccounts } from '../lib/accountsContext'
import { dayKey } from '../lib/stats'
import { dayLabel, fmtTime, money, pnlColor } from '../lib/format'
import { useTrades } from '../lib/tradesContext'

const GREEN = '#22e55c'
const RED = '#ff4d5e'
const MUTED = '#a9b8ad'
const LINE = '#2a3a2c'
const axis = { stroke: MUTED, fontSize: 12, tickLine: false, axisLine: { stroke: LINE } } as const
const tooltipStyle = { background: '#0a0f0a', border: `1px solid ${LINE}`, borderRadius: 8, color: '#f5f7f5' }
const usd = (v: number) => `${v < 0 ? '-' : ''}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`

export default function AccountDetail() {
  const { id } = useParams()
  const { t, tn, locale } = useI18n()
  const { trades, loading } = useTrades()
  const { accounts, states, loading: accountsLoading } = useAccounts()
  const account = accounts.find((a) => a.id === id)
  const state = account ? states[account.id] : undefined

  // The account's trades in time order, each paired with the balance after it (the opening point comes first).
  const rows = useMemo(() => {
    if (!account) return []
    const mine = trades.filter((t) => t.accountId === account.id).sort((a, b) => a.entryTime.localeCompare(b.entryTime) || a.id.localeCompare(b.id))
    return mine.map((trade, i) => ({ trade, point: states[account.id].points[i + 1] ?? null })).reverse() // newest first
  }, [trades, account, states])

  if (loading || accountsLoading) return <p className="text-muted">{t('common.loading')}</p>
  if (!account || !state) return <p className="text-loss">{t('accounts.detail.notFound')}</p>

  const chart = state.points.map((p, i) => ({ n: i, day: p.day, balance: p.balance, floor: p.floor }))
  const all = chart.flatMap((p) => [p.balance, p.floor])
  const low = Math.min(...all, account.startBalance - account.maxDrawdown) - 300
  const high = Math.max(...all, account.profitGoal) + 300

  return (
    <div className="max-w-5xl space-y-4">
      <Link to="/accounts" className="inline-flex items-center gap-2 text-sm text-muted hover:text-green">
        <ArrowLeft size={16} /> {t('accounts.detail.back')}
      </Link>
      <AccountCard account={account} state={state} />

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 font-semibold">{t('accounts.detail.chart')}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chart}>
            <CartesianGrid stroke={LINE} vertical={false} />
            <XAxis dataKey="n" {...axis} allowDecimals={false} />
            <YAxis {...axis} domain={[low, high]} tickFormatter={usd} width={70} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(n) => (Number(n) === 0 ? t('accounts.chart.start') : dayLabel(chart[Number(n)]?.day ?? account.openedAt, locale))}
              formatter={(v, name) => [money(Number(v)), name === 'balance' ? t('accounts.chart.balance') : t('accounts.chart.limit')]}
            />
            <ReferenceLine y={account.profitGoal} stroke={GREEN} strokeDasharray="5 5" label={{ value: t('accounts.chart.goal'), fill: GREEN, fontSize: 12, position: 'insideTopLeft' }} />
            <Line type="stepAfter" dataKey="floor" stroke={RED} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="balance" stroke={GREEN} strokeWidth={2} dot={{ r: 3, fill: GREEN }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 font-semibold">
          {t('accounts.detail.trades')} <span className="text-sm font-normal text-muted">({tn('unit.trade', rows.length)})</span>
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">{t('accounts.detail.noTrades')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-2">{t('trades.col.date')}</th>
                  <th className="pb-2">{t('trades.col.symbol')}</th>
                  <th className="pb-2">{t('trades.col.session')}</th>
                  <th className="pb-2">{t('trades.col.return')}</th>
                  <th className="pb-2">{t('accounts.detail.balanceAfter')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ trade, point }) => (
                  <tr key={trade.id} className="border-t border-line">
                    <td className="py-2">
                      {dayLabel(dayKey(trade.entryTime), locale)} <span className="text-muted">{fmtTime(trade.entryTime)}</span>
                    </td>
                    <td className="font-semibold">{trade.symbol}</td>
                    <td className="text-muted">{trade.session ? t(`session.${trade.session}`) : t('session.none')}</td>
                    <td className={`font-semibold ${pnlColor(trade.pnl)}`}>{money(trade.pnl)}</td>
                    <td>{point ? money(point.balance) : <span className="text-xs text-muted">{t('accounts.detail.afterEnd')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
