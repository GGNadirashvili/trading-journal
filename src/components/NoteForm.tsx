import { useState, type FormEvent, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import { fromLocalInput, toLocalInput } from '../lib/format'
import type { Note, NoteInput } from '../lib/notesApi'
import { SESSIONS, type Session } from '../lib/sessions'
import { useSettings } from '../lib/settingsContext'
import ChipPicker from './ChipPicker'

const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-green'
const optText = (s: string) => (s.trim() === '' ? null : s.trim())

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
  initial?: Note
  /** The screenshots area, shown between the fields and the Save button. */
  children?: ReactNode
  /** True when there is already something to save besides the fields (a screenshot). */
  hasExtraContent: boolean
  onSubmit: (n: NoteInput) => Promise<void>
  onCancel: () => void
}

export default function NoteForm({ initial, children, hasExtraContent, onSubmit, onCancel }: Props) {
  const { t } = useI18n()
  const { symbols, optionNames, label } = useSettings()
  const [notedAt, setNotedAt] = useState(() => toLocalInput(initial?.notedAt ?? new Date().toISOString()))
  const [session, setSession] = useState<Session | ''>(initial?.session ?? '')
  const [symbol, setSymbol] = useState(initial?.symbol ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // A symbol that was later removed from the list stays selectable on the notes that use it.
  const symbolCodes = [...symbols.map((s) => s.code), ...(symbol && !symbols.some((s) => s.code === symbol) ? [symbol] : [])]

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim() && !body.trim() && !hasExtraContent) return setError(t('note.needContent'))
    setBusy(true)
    try {
      await onSubmit({
        notedAt: fromLocalInput(notedAt) ?? new Date().toISOString(),
        title: optText(title),
        body: body.trim(),
        session: session || null,
        symbol: symbol || null,
        tags,
      })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('note.when')}>
          <input className={input} type="datetime-local" value={notedAt} onChange={(e) => setNotedAt(e.target.value)} required />
        </Field>
        <Field label={t('note.session')}>
          <select className={input} value={session} onChange={(e) => setSession(e.target.value as Session | '')}>
            <option value="">{t('note.sessionNone')}</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {t(`session.${s}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('note.symbol')}>
          <select className={input} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option value="">{t('note.symbolNone')}</option>
            {symbolCodes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={t('note.titleLabel')} wide>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </div>
      <Field label={t('note.text')} hint={t('note.textHint')}>
        <textarea className={input} rows={9} value={body} onChange={(e) => setBody(e.target.value)} autoFocus={!initial} />
      </Field>
      <div>
        <span className="mb-2 block text-xs uppercase tracking-wider text-muted">{t('note.tags')}</span>
        <ChipPicker options={optionNames('tag')} selected={tags} onToggle={(v) => setTags((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))} emptyHint={t('form.noTags')} label={(v) => label('tag', v)} />
      </div>

      {children}

      {error && <p className="text-sm text-loss">{error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className="rounded-lg bg-green px-5 py-2 font-semibold text-black disabled:opacity-50">
          {busy ? t('note.saving') : t('note.save')}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-5 py-2 font-semibold hover:text-green">
          {t('note.cancel')}
        </button>
      </div>
    </form>
  )
}
