import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import { evaluateAccount, type Account, type AccountState, type DrawdownType } from '../lib/accounts'
import type { AccountInput } from '../lib/accountsApi'
import { money } from '../lib/format'
import { DuplicateError } from '../lib/settingsApi'
import { dayKey } from '../lib/stats'
import type { Trade } from '../lib/types'

const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'
const round2 = (x: number) => Math.round(x * 100) / 100
const NO_TRADES: Trade[] = []
const num = (s: string): number | null => (s.trim() === '' ? null : Number(s))

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

interface Props {
  /** Present when editing. */
  initial?: Account
  /** Where the account stands now (editing only). */
  currentState?: AccountState
  /** Trades that belong to the account being edited. */
  accountTrades?: Trade[]
  /** Trades that have no account yet (offered for assignment when adding). */
  unassigned?: Trade[]
  onSubmit: (input: AccountInput, assignUnassigned: boolean) => Promise<void>
  onCancel: () => void
}

export default function AccountForm({ initial, currentState, accountTrades = NO_TRADES, unassigned = NO_TRADES, onSubmit, onCancel }: Props) {
  const { t, tn } = useI18n()
  const [name, setName] = useState(initial?.name ?? '')
  const [size, setSize] = useState(String(initial?.startBalance ?? 50000))
  const [drawdown, setDrawdown] = useState(String(initial?.maxDrawdown ?? 2000))
  const [goal, setGoal] = useState(String(initial?.profitGoal ?? 53000))
  const [type, setType] = useState<DrawdownType>(initial?.drawdownType ?? 'trailing')
  const [lock, setLock] = useState(initial?.lockAtStart ?? true)
  const originalCurrent = currentState ? String(currentState.balance) : ''
  const [current, setCurrent] = useState(originalCurrent)
  const [peak, setPeak] = useState(initial?.peakBaseline != null ? String(initial.peakBaseline) : '')
  const [opened, setOpened] = useState(() => initial?.openedAt ?? dayKey(new Date().toISOString()))
  const [assign, setAssign] = useState(unassigned.length > 0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const trailing = type !== 'static'
  const tradesInPlay = useMemo(() => (initial ? accountTrades : assign ? unassigned : NO_TRADES), [initial, accountTrades, assign, unassigned])

  // The account as typed so far, or null while a number is missing or invalid.
  const draft = useMemo<{ input: AccountInput; problem: string | null }>(() => {
    const s = Number(size)
    const d = Number(drawdown)
    const g = Number(goal)
    const cur = num(current)
    const pk = trailing ? num(peak) : null
    let problem: string | null = null
    if (!name.trim()) problem = 'accounts.err.name'
    else if (!(s > 0) || !(d > 0) || !(g > 0)) problem = 'accounts.err.numbers'
    else if (!(g > s)) problem = 'accounts.err.goal'
    else if ((cur !== null && Number.isNaN(cur)) || (pk !== null && Number.isNaN(pk))) problem = 'accounts.err.optional'

    // "Current balance" is what the account shows after all of its trades. When you leave the field as it was
    // while editing, the stored adjustment is kept as it is.
    const sumPnl = tradesInPlay.reduce((a, x) => a + x.pnl, 0)
    const untouched = Boolean(initial) && current === originalCurrent
    const adjustment = untouched ? initial!.adjustment : cur !== null && !Number.isNaN(cur) ? round2(cur - s - sumPnl) : 0
    return {
      problem,
      input: {
        name: name.trim(),
        startBalance: s,
        maxDrawdown: d,
        profitGoal: g,
        drawdownType: type,
        lockAtStart: lock,
        adjustment,
        peakBaseline: pk !== null && !Number.isNaN(pk) ? pk : null,
        openedAt: opened,
      },
    }
  }, [name, size, drawdown, goal, type, lock, current, peak, opened, trailing, tradesInPlay, initial, originalCurrent])

  const preview = useMemo(() => {
    if (draft.problem) return null
    const account: Account = { ...draft.input, id: 'draft', manualStatus: initial?.manualStatus ?? null, manualClosedAt: initial?.manualClosedAt ?? null }
    return evaluateAccount(account, tradesInPlay)
  }, [draft, tradesInPlay, initial])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (draft.problem) return setError(t(draft.problem as 'accounts.err.name'))
    setBusy(true)
    try {
      await onSubmit(draft.input, !initial && assign)
    } catch (err) {
      setError(err instanceof DuplicateError ? t('admin.exists', { name: err.itemName }) : (err as Error).message)
      setBusy(false)
    }
  }

  const goalProfit = Number(goal) - Number(size)

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-green/40 bg-surface p-4">
      <h2 className="text-lg font-semibold">{initial ? t('accounts.form.titleEdit') : t('accounts.form.titleNew')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('accounts.form.name')} wide>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('accounts.form.namePlaceholder')} required autoFocus />
        </Field>
        <Field label={t('accounts.form.size')}>
          <input className={input} type="number" step="any" min="0" value={size} onChange={(e) => setSize(e.target.value)} required />
        </Field>
        <Field label={t('accounts.form.drawdown')}>
          <input className={input} type="number" step="any" min="0" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} required />
        </Field>
        <Field label={t('accounts.form.goal')} hint={goalProfit > 0 ? t('accounts.form.goalHint', { amount: money(goalProfit) }) : undefined}>
          <input className={input} type="number" step="any" min="0" value={goal} onChange={(e) => setGoal(e.target.value)} required />
        </Field>
        <Field label={t('accounts.form.type')} hint={t('accounts.form.typeHint')}>
          <select className={input} value={type} onChange={(e) => setType(e.target.value as DrawdownType)}>
            {(['trailing', 'trailing_eod', 'static'] as const).map((k) => (
              <option key={k} value={k}>
                {t(`accounts.type.${k}`)}
              </option>
            ))}
          </select>
        </Field>
        {trailing && (
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="mt-1" />
            <span>{t('accounts.form.lock')}</span>
          </label>
        )}
        <Field label={t('accounts.form.current')} hint={t('accounts.form.currentHint')}>
          <input className={input} type="number" step="any" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        {trailing && (
          <Field label={t('accounts.form.peak')} hint={t('accounts.form.peakHint')}>
            <input className={input} type="number" step="any" value={peak} onChange={(e) => setPeak(e.target.value)} />
          </Field>
        )}
        <Field label={t('accounts.form.opened')}>
          <input className={input} type="date" value={opened} onChange={(e) => setOpened(e.target.value)} required />
        </Field>
        {!initial && unassigned.length > 0 && (
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={assign} onChange={(e) => setAssign(e.target.checked)} className="mt-1" />
            <span>{t('accounts.form.assign', { n: unassigned.length })}</span>
          </label>
        )}
      </div>

      {preview && (
        <div className="rounded-lg border border-line bg-bg p-3 text-sm">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted">{t('accounts.form.preview')}</div>
          <div>
            {t('accounts.form.previewLine', { balance: money(preview.balance), floor: money(preview.floor), buffer: money(Math.max(0, preview.buffer)), toGoal: money(preview.toGoal) })}
          </div>
          {preview.status !== 'active' && <div className="mt-1 text-warn">{t('accounts.form.previewEnded', { status: t(`account.status.${preview.status}`) })}</div>}
          <div className="mt-1 text-xs text-muted">{tn('unit.trade', preview.trades)}</div>
        </div>
      )}

      {error && <p className="text-sm text-loss">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-50">
          {initial ? t('accounts.form.save') : t('accounts.form.create')}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-5 py-2 font-semibold hover:text-green">
          {t('accounts.form.cancel')}
        </button>
      </div>
    </form>
  )
}
