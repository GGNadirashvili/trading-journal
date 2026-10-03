import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fmtDate, fmtTime, holdTime, money, pnlColor } from '../lib/format'
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
  const [query, setQuery] = useState('')
  const [symbol, setSymbol] = useState('all')
  const [sort, setSort] = useState<Sort>({ key: 'entryTime', dir: 'desc' })

  const symbols = useMemo(() => [...new Set(trades.map((t) => t.symbol))].sort(), [trades])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = trades.filter(
      (t) =>
        (symbol === 'all' || t.symbol === symbol) &&
        (!q ||
          [t.symbol, t.notes, t.setup, t.emotionBefore, t.emotionAfter, ...t.tags, ...t.emotionTags]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q))),
    )
    const sign = sort.dir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      const x = a[sort.key]
      const y = b[sort.key]
      return (x < y ? -1 : x > y ? 1 : 0) * sign
    })
  }, [trades, query, symbol, sort])

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  if (loading) return <p className="text-muted">Loading…</p>
  if (error) return <p className="text-loss">{error}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Trades</h1>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-green"
        >
          <option value="all">All symbols</option>
          {symbols.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, emotions, tags"
            className="w-56 bg-transparent text-green outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-line">
            <tr>
              <Th k="entryTime" sort={sort} onSort={toggle}>Date</Th>
              <Th k="symbol" sort={sort} onSort={toggle}>Symbol</Th>
              <th className={HEAD}>Status</th>
              <th className={HEAD}>Dir</th>
              <Th k="qty" sort={sort} onSort={toggle}>Qty</Th>
              <th className={HEAD}>Entry</th>
              <th className={HEAD}>Exit</th>
              <th className={HEAD}>Hold</th>
              <Th k="pnl" sort={sort} onSort={toggle}>Return</Th>
              <th className={HEAD}>Emotion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <Row key={t.id} t={t} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-muted">
                  No trades yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ t }: { t: Trade }) {
  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface-2">
      <td className={CELL}>
        {fmtDate(t.entryTime)} <span className="text-muted">{fmtTime(t.entryTime)}</span>
      </td>
      <td className={`${CELL} font-semibold`}>{t.symbol}</td>
      <td className={`${CELL} ${t.status === 'open' ? 'text-warn' : 'text-muted'}`}>{t.status}</td>
      <td className={CELL}>{t.direction === 'long' ? 'Long' : 'Short'}</td>
      <td className={CELL}>{t.qty}</td>
      <td className={CELL}>{t.entryPrice ?? '-'}</td>
      <td className={CELL}>{t.exitPrice ?? '-'}</td>
      <td className={`${CELL} text-muted`}>{holdTime(t.entryTime, t.exitTime)}</td>
      <td className={`${CELL} font-semibold ${pnlColor(t.pnl)}`}>{money(t.pnl)}</td>
      <td className={`${CELL} text-muted`}>{t.emotionTags.join(', ') || '-'}</td>
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
