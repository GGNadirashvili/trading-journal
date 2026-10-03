import { ChevronDown, ChevronUp, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { dayKey } from '../lib/stats'
import { useI18n } from '../i18n/context'
import { useSettings } from '../lib/settingsContext'
import { fmtDate, fmtTime, holdMinutes, money, pnlColor } from '../lib/format'
import { useTrades } from '../lib/tradesContext'
import type { Trade } from '../lib/types'

type SortKey = 'entryTime' | 'symbol' | 'pnl' | 'qty'
interface Sort {
  key: SortKey
  dir: 'asc' | 'desc'
}

const HEAD = 'px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted'
const CELL = 'px-3 py-3 text-sm'

export default function Trades() {
  const { trades, loading, error } = useTrades()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { label } = useSettings()
  const [params, setParams] = useSearchParams()
  const date = params.get('date')
  const [query, setQuery] = useState('')
  const [symbol, setSymbol] = useState('all')
  const [sort, setSort] = useState<Sort>({ key: 'entryTime', dir: 'desc' })

  const symbols = useMemo(() => [...new Set(trades.map((t) => t.symbol))].sort(), [trades])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = trades.filter(
      (t) =>
        (symbol === 'all' || t.symbol === symbol) &&
        (!date || dayKey(t.entryTime) === date) &&
        (!q ||
          [
            t.symbol,
            t.notes,
            t.setup,
            t.emotionBefore,
            t.emotionAfter,
            ...t.tags,
            ...t.emotionTags,
            // also match the names as shown on screen, so a Georgian search finds Georgian labels
            t.setup && label('setup', t.setup),
            ...t.tags.map((x) => label('tag', x)),
            ...t.emotionTags.map((x) => label('emotion', x)),
          ]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q))),
    )
    const sign = sort.dir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      const x = a[sort.key]
      const y = b[sort.key]
      return (x < y ? -1 : x > y ? 1 : 0) * sign
    })
  }, [trades, query, symbol, date, sort, label])

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error) return <p className="text-loss">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{t('trades.title')}</h1>
        {date && (
          <button onClick={() => setParams({})} className="mr-auto flex items-center gap-1 rounded-full border border-green px-3 py-1 text-sm">
            {date} <X size={14} />
          </button>
        )}
        <span className="mr-auto" />
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="all">{t('trades.allSymbols')}</option>
          {symbols.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('trades.search')}
            className="w-56 bg-transparent text-fg outline-none placeholder:text-muted"
          />
        </label>
        <Link to="/trades/new" className="flex items-center gap-2 rounded-lg bg-green px-3 py-2 text-sm font-semibold text-black">
          <Plus size={16} /> {t('trades.new')}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-line">
            <tr>
              <Th k="entryTime" sort={sort} onSort={toggle}>{t('trades.col.date')}</Th>
              <Th k="symbol" sort={sort} onSort={toggle}>{t('trades.col.symbol')}</Th>
              <th className={HEAD}>{t('trades.col.dir')}</th>
              <th className={HEAD}>{t('trades.col.session')}</th>
              <Th k="qty" sort={sort} onSort={toggle}>{t('trades.col.qty')}</Th>
              <th className={HEAD}>{t('trades.col.entry')}</th>
              <th className={HEAD}>{t('trades.col.exit')}</th>
              <th className={HEAD}>{t('trades.col.hold')}</th>
              <Th k="pnl" sort={sort} onSort={toggle}>{t('trades.col.return')}</Th>
              <th className={HEAD}>{t('trades.col.emotion')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <Row key={t.id} trade={t} onOpen={() => navigate(`/trades/${t.id}`)} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-muted">
                  {t('trades.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ trade, onOpen }: { trade: Trade; onOpen: () => void }) {
  const { t, locale } = useI18n()
  const { label } = useSettings()
  const minutes = holdMinutes(trade.entryTime, trade.exitTime)
  const hold = minutes === null ? '-' : minutes < 60 ? t('unit.minutes', { n: minutes }) : t('unit.hoursMinutes', { h: Math.floor(minutes / 60), m: minutes % 60 })
  return (
    <tr onClick={onOpen} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2">
      <td className={CELL}>
        {fmtDate(trade.entryTime, locale)} <span className="text-muted">{fmtTime(trade.entryTime)}</span>
      </td>
      <td className={`${CELL} font-semibold`}>{trade.symbol}</td>
      <td className={CELL}>{trade.direction === 'long' ? t('dir.long') : t('dir.short')}</td>
      <td className={`${CELL} text-muted`}>{trade.session ? t(`session.${trade.session}`) : t('session.none')}</td>
      <td className={CELL}>{trade.qty}</td>
      <td className={CELL}>{trade.entryPrice ?? '-'}</td>
      <td className={CELL}>{trade.exitPrice ?? '-'}</td>
      <td className={`${CELL} text-muted`}>{hold}</td>
      <td className={`${CELL} font-semibold ${pnlColor(trade.pnl)}`}>{money(trade.pnl)}</td>
      <td className={`${CELL} text-muted`}>{trade.emotionTags.map((e) => label('emotion', e)).join(', ') || '-'}</td>
    </tr>
  )
}

function Th({ k, sort, onSort, children }: { k: SortKey; sort: Sort; onSort: (k: SortKey) => void; children: string }) {
  const active = sort.key === k
  return (
    <th className={HEAD}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-1 uppercase ${active ? 'text-green' : ''}`}>
        {children}
        {active && (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
    </th>
  )
}
