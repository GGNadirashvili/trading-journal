import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { money, pnlColor } from '../lib/format'
import { parseJson, parseRows, type ParseResult, type RawRow } from '../lib/importTrades'
import { useSettings } from '../lib/settingsContext'
import { useTrades } from '../lib/tradesContext'

type Mode = 'grid' | 'json'

const COLS: { key: keyof RawRow; label: string; width: string; placeholder?: string }[] = [
  { key: 'date', label: 'Date', width: 'w-36', placeholder: '2026-09-07' },
  { key: 'time', label: 'Time', width: 'w-20', placeholder: '09:30' },
  { key: 'symbol', label: 'Symbol', width: 'w-20', placeholder: 'MNQ' },
  { key: 'direction', label: 'Dir', width: 'w-20', placeholder: 'long' },
  { key: 'qty', label: 'Qty', width: 'w-16', placeholder: '1' },
  { key: 'entry', label: 'Entry', width: 'w-24' },
  { key: 'exit', label: 'Exit', width: 'w-24' },
  { key: 'pnl', label: 'P&L', width: 'w-24' },
  { key: 'emotionTags', label: 'Emotions', width: 'w-40', placeholder: 'calm, fomo' },
  { key: 'notes', label: 'Notes', width: 'w-64' },
]

const JSON_EXAMPLE = `[
  { "date": "2026-09-07", "time": "09:30", "symbol": "MNQ", "direction": "long", "qty": 1,
    "entry": 20000, "exit": 20010,
    "emotionBefore": "calm", "emotionAfter": "confident", "emotionTags": ["calm"], "notes": "..." },
  { "date": "2026-09-07", "time": "10:15", "symbol": "ES", "direction": "short", "pnl": -120.5 }
]`

const emptyRow = (symbol: string): RawRow => ({ date: '', time: '', symbol, direction: 'long', qty: '1' })
const isEmpty = (r: RawRow) => !r.date && !r.pnl && !r.entry && !r.exit && !r.notes && !r.emotionTags

export default function Import() {
  const { addMany } = useTrades()
  const { pointValues, symbols } = useSettings()
  const navigate = useNavigate()
  const defaultSymbol = symbols[0]?.code ?? ''
  const [mode, setMode] = useState<Mode>('grid')
  const [rows, setRows] = useState<RawRow[]>(() => [emptyRow(defaultSymbol), emptyRow(defaultSymbol), emptyRow(defaultSymbol)])
  const [json, setJson] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const result: ParseResult = useMemo(
    () => (mode === 'grid' ? parseRows(rows.filter((r) => !isEmpty(r)), pointValues) : json.trim() ? parseJson(json, pointValues) : { trades: [], errors: [] }),
    [mode, rows, json, pointValues],
  )

  const setCell = (i: number, key: keyof RawRow, value: string) =>
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))

  async function run() {
    setBusy(true)
    setFailure(null)
    try {
      await addMany(result.trades)
      navigate('/')
    } catch (e) {
      setFailure((e as Error).message)
      setBusy(false)
    }
  }

  const cell = 'rounded border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-green'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Import trades</h1>
        {(['grid', 'json'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-3 py-1 text-sm ${mode === m ? 'bg-green text-black' : 'border border-line text-muted hover:text-green'}`}
          >
            {m === 'grid' ? 'Bulk entry' : 'Paste JSON'}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        Leave P&L empty to compute it from entry/exit prices (known symbols only). Times are your local time.
        Screenshots can be added to each trade after importing.
      </p>

      {mode === 'grid' ? (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-line bg-surface p-3">
            <table>
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} className="px-1 pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      {c.label}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {COLS.map((c) => (
                      <td key={c.key} className="p-1">
                        <input
                          className={`${cell} ${c.width}`}
                          placeholder={c.placeholder}
                          value={String(r[c.key] ?? '')}
                          onChange={(e) => setCell(i, c.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button onClick={() => setRows((cur) => cur.filter((_, idx) => idx !== i))} title="Remove row" className="p-1 text-muted hover:text-loss">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setRows((cur) => [...cur, { ...emptyRow(defaultSymbol), date: cur.at(-1)?.date ?? '' }])} className="flex items-center gap-2 text-sm text-green">
            <Plus size={16} /> Add row
          </button>
        </div>
      ) : (
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder={JSON_EXAMPLE}
          rows={14}
          spellCheck={false}
          className="w-full rounded-xl border border-line bg-surface p-3 font-mono text-sm text-fg outline-none placeholder:text-muted focus:border-green"
        />
      )}

      {result.errors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-loss/50 p-3 text-sm text-loss">
          {result.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {result.trades.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-3 text-sm">
          <div className="mb-2 text-muted">Preview: {result.trades.length} {result.trades.length === 1 ? 'trade' : 'trades'} ready</div>
          <ul className="space-y-1">
            {result.trades.map((t, i) => (
              <li key={i} className="flex gap-4">
                <span className="w-44 text-muted">{new Date(t.entryTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="w-16 font-semibold">{t.symbol}</span>
                <span className="w-16">{t.direction}</span>
                <span className={`font-semibold ${pnlColor(t.pnl)}`}>{money(t.pnl)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {failure && <p className="text-sm text-loss">{failure}</p>}
      <button
        onClick={run}
        disabled={busy || result.trades.length === 0 || result.errors.length > 0}
        className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-40"
      >
        {busy ? 'Importing…' : `Import ${result.trades.length} ${result.trades.length === 1 ? 'trade' : 'trades'}`}
      </button>
      {result.errors.length > 0 && <p className="text-xs text-muted">Fix the errors above to enable import. Nothing is saved until every row is valid.</p>}
    </div>
  )
}
