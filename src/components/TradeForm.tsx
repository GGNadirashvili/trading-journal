import { useState, type FormEvent, type ReactNode } from 'react'
import { pnlFromPrices } from '../lib/contracts'
import { EMOTION_TAGS } from '../lib/emotions'
import { fromLocalInput, toLocalInput } from '../lib/format'
import type { TradeInput } from '../lib/tradesApi'
import type { Direction, TradeStatus } from '../lib/types'

const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

const splitTags = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

const optNum = (s: string) => (s.trim() === '' ? null : Number(s))
const optText = (s: string) => (s.trim() === '' ? null : s.trim())

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  )
}

interface Props {
  initial?: TradeInput
  submitLabel: string
  onSubmit: (t: TradeInput) => Promise<void>
}

export default function TradeForm({ initial, submitLabel, onSubmit }: Props) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? 'MNQ')
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? 'long')
  const [qty, setQty] = useState(String(initial?.qty ?? 1))
  const [entryPrice, setEntryPrice] = useState(initial?.entryPrice?.toString() ?? '')
  const [exitPrice, setExitPrice] = useState(initial?.exitPrice?.toString() ?? '')
  const [entryTime, setEntryTime] = useState(() => toLocalInput(initial?.entryTime ?? new Date().toISOString()))
  const [exitTime, setExitTime] = useState(toLocalInput(initial?.exitTime ?? null))
  const [status, setStatus] = useState<TradeStatus>(initial?.status ?? 'closed')
  const [pnl, setPnl] = useState(initial ? String(initial.pnl) : '')
  const [setup, setSetup] = useState(initial?.setup ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [emotionBefore, setEmotionBefore] = useState(initial?.emotionBefore ?? '')
  const [emotionAfter, setEmotionAfter] = useState(initial?.emotionAfter ?? '')
  const [emotionTags, setEmotionTags] = useState<string[]>(initial?.emotionTags ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const toggleEmotion = (e: string) =>
    setEmotionTags((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const q = Number(qty)
    const ep = optNum(entryPrice)
    const xp = optNum(exitPrice)
    // Typed P&L wins; otherwise it is computed from the prices.
    let net = optNum(pnl)
    if (net === null) {
      const gross = pnlFromPrices(symbol, direction, q, ep, xp)
      if (gross === null && status === 'closed') {
        setError('Enter the P&L, or entry and exit prices for a known symbol (MNQ, ES, NQ, MES).')
        return
      }
      net = gross ?? 0
    }
    setBusy(true)
    try {
      await onSubmit({
        symbol: symbol.trim().toUpperCase(),
        direction,
        qty: q,
        entryPrice: ep,
        exitPrice: xp,
        entryTime: fromLocalInput(entryTime) ?? new Date().toISOString(),
        exitTime: fromLocalInput(exitTime),
        status,
        pnl: Math.round(net * 100) / 100,
        setup: optText(setup),
        tags: splitTags(tags),
        emotionBefore: optText(emotionBefore),
        emotionAfter: optText(emotionAfter),
        emotionTags,
        notes: optText(notes),
      })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Symbol">
          <input className={input} list="symbols" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
          <datalist id="symbols">
            <option value="MNQ" />
            <option value="ES" />
          </datalist>
        </Field>
        <Field label="Direction">
          <select className={input} value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </Field>
        <Field label="Quantity">
          <input className={input} type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </Field>
        <Field label="Status">
          <select className={input} value={status} onChange={(e) => setStatus(e.target.value as TradeStatus)}>
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
        </Field>
        <Field label="Entry price">
          <input className={input} type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
        </Field>
        <Field label="Exit price">
          <input className={input} type="number" step="any" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
        </Field>
        <Field label="Entry time">
          <input className={input} type="datetime-local" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} required />
        </Field>
        <Field label="Exit time">
          <input className={input} type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
        </Field>
        <Field label="P&L ($), blank = from prices">
          <input className={input} type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} />
        </Field>
        <Field label="Setup">
          <input className={input} value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="e.g. opening range break" />
        </Field>
        <Field label="Tags (comma separated)">
          <input className={input} value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold">Emotional state</h2>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => toggleEmotion(e)}
              className={`rounded-full border px-3 py-1 text-sm ${
                emotionTags.includes(e) ? 'border-green bg-green text-black' : 'border-line text-muted hover:text-green'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Before the trade">
            <textarea className={input} rows={3} value={emotionBefore} onChange={(e) => setEmotionBefore(e.target.value)} />
          </Field>
          <Field label="After the trade">
            <textarea className={input} rows={3} value={emotionAfter} onChange={(e) => setEmotionAfter(e.target.value)} />
          </Field>
        </div>
      </section>

      <Field label="Notes" wide>
        <textarea className={input} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {error && <p className="text-sm text-loss">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-50">
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
