import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { pnlFromPrices } from '../lib/contracts'
import { useI18n } from '../i18n/context'
import { useAccounts } from '../lib/accountsContext'
import { fromLocalInput, toLocalInput } from '../lib/format'
import { useSettings } from '../lib/settingsContext'
import type { TradeInput } from '../lib/tradesApi'
import { SESSIONS, type Session } from '../lib/sessions'
import type { Direction } from '../lib/types'
import ChipPicker from './ChipPicker'

const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'

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
  const { symbols, pointValues, optionNames, label } = useSettings()
  const { t } = useI18n()
  const { accounts, active, states, selected } = useAccounts()
  // Only accounts still in play can take new trades. A trade being edited keeps its own account even if it has finished.
  const ownAccount = initial?.accountId ? accounts.find((a) => a.id === initial.accountId) : undefined
  const accountChoices = [...active, ...(ownAccount && !active.some((a) => a.id === ownAccount.id) ? [ownAccount] : [])]
  const [accountId, setAccountId] = useState<string>(() => initial?.accountId ?? (active.some((a) => a.id === selected) ? selected : active.length === 1 ? active[0].id : ''))
  const [symbol, setSymbol] = useState(initial?.symbol ?? symbols[0]?.code ?? '')
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? 'long')
  // Starts empty on purpose: the session must be chosen for every trade, there is no default.
  const [session, setSession] = useState<Session | ''>(initial?.session ?? '')
  const [qty, setQty] = useState(String(initial?.qty ?? 1))
  const [entryPrice, setEntryPrice] = useState(initial?.entryPrice?.toString() ?? '')
  const [exitPrice, setExitPrice] = useState(initial?.exitPrice?.toString() ?? '')
  const [entryTime, setEntryTime] = useState(() => toLocalInput(initial?.entryTime ?? new Date().toISOString()))
  const [exitTime, setExitTime] = useState(toLocalInput(initial?.exitTime ?? null))
  const [pnl, setPnl] = useState(initial ? String(initial.pnl) : '')
  const [setup, setSetup] = useState(initial?.setup ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [emotionBefore, setEmotionBefore] = useState(initial?.emotionBefore ?? '')
  const [emotionAfter, setEmotionAfter] = useState(initial?.emotionAfter ?? '')
  const [emotionTags, setEmotionTags] = useState<string[]>(initial?.emotionTags ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = (set: typeof setTags) => (v: string) => set((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))
  // Keep the trade's own symbol selectable even if it was later removed from the admin list.
  const symbolCodes = [...symbols.map((s) => s.code), ...(symbol && !pointValues[symbol] ? [symbol] : [])]

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!session) return setError(t('form.sessionRequired'))
    // With accounts set up, every trade must name one. Trades that already had none may stay that way.
    if (accounts.length > 0 && !accountId && initial?.accountId !== null) return setError(t('form.accountRequired'))
    const q = Number(qty)
    const ep = optNum(entryPrice)
    const xp = optNum(exitPrice)
    // Typed P&L wins; otherwise it is computed from the prices.
    let net = optNum(pnl)
    if (net === null) {
      const gross = pnlFromPrices(pointValues, symbol, direction, q, ep, xp)
      if (gross === null) {
        setError(t('form.pnlRequired'))
        return
      }
      net = gross
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
        pnl: Math.round(net * 100) / 100,
        setup: optText(setup),
        tags,
        emotionBefore: optText(emotionBefore),
        emotionAfter: optText(emotionAfter),
        emotionTags,
        notes: optText(notes),
        session,
        accountId: accountId || null,
      })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {accounts.length === 0 || accountChoices.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warn p-3 text-sm text-warn">
          <span>{accounts.length === 0 ? t('form.noAccountsYet') : t('form.allAccountsClosed')}</span>
          <Link to="/accounts" className="rounded-lg bg-green px-3 py-1.5 font-semibold text-black">
            {t('form.addAccount')}
          </Link>
        </div>
      ) : (
        <Field label={t('form.account')}>
          <select className={`${input} sm:w-80`} value={accountId} onChange={(e) => setAccountId(e.target.value)} required={initial?.accountId !== null}>
            <option value="" disabled={initial?.accountId !== null}>
              {t('form.accountPick')}
            </option>
            {accountChoices.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {states[a.id].status === 'active' ? '' : ` (${t(`account.status.${states[a.id].status}`)})`}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t('form.symbol')}>
          <select className={input} value={symbol} onChange={(e) => setSymbol(e.target.value)} required>
            {symbolCodes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={t('form.direction')}>
          <select className={input} value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="long">{t('dir.long')}</option>
            <option value="short">{t('dir.short')}</option>
          </select>
        </Field>
        <Field label={t('form.session')}>
          <select className={input} value={session} onChange={(e) => setSession(e.target.value as Session | '')} required>
            <option value="" disabled>
              {t('form.sessionPick')}
            </option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {t(`session.${s}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('form.qty')}>
          <input className={input} type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </Field>
        <Field label={t('form.entryPrice')}>
          <input className={input} type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
        </Field>
        <Field label={t('form.exitPrice')}>
          <input className={input} type="number" step="any" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
        </Field>
        <Field label={t('form.entryTime')}>
          <input className={input} type="datetime-local" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} required />
        </Field>
        <Field label={t('form.exitTime')}>
          <input className={input} type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
        </Field>
        <Field label={t('form.pnl')}>
          <input className={input} type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} />
        </Field>
        <Field label={t('form.setup')}>
          <select className={input} value={setup} onChange={(e) => setSetup(e.target.value)}>
            <option value="">{t('form.setupNone')}</option>
            {/* a setup that was later removed from the list stays selectable on the trades that use it */}
            {[...optionNames('setup'), ...(setup && !optionNames('setup').includes(setup) ? [setup] : [])].map((n) => (
              <option key={n} value={n}>
                {label('setup', n)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <span className="mb-2 block text-xs uppercase tracking-wider text-muted">{t('form.tags')}</span>
        <ChipPicker options={optionNames('tag')} selected={tags} onToggle={toggle(setTags)} emptyHint={t('form.noTags')} label={(v) => label('tag', v)} />
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-4">
        <h2 className="font-semibold">{t('form.emotionalState')}</h2>
        <ChipPicker
          options={optionNames('emotion')}
          selected={emotionTags}
          onToggle={toggle(setEmotionTags)}
          emptyHint={t('form.noEmotions')}
          label={(v) => label('emotion', v)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.before')}>
            <textarea className={input} rows={3} value={emotionBefore} onChange={(e) => setEmotionBefore(e.target.value)} />
          </Field>
          <Field label={t('form.after')}>
            <textarea className={input} rows={3} value={emotionAfter} onChange={(e) => setEmotionAfter(e.target.value)} />
          </Field>
        </div>
      </section>

      <Field label={t('form.notes')} wide>
        <textarea className={input} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {error && <p className="text-sm text-loss">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-50">
        {busy ? t('trade.saving') : submitLabel}
      </button>
    </form>
  )
}
