import { Image, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/context'
import { fmtDate, fmtTime } from '../lib/format'
import type { Note } from '../lib/notesApi'
import { useNotes } from '../lib/notesContext'
import { SESSIONS } from '../lib/sessions'
import { useSettings } from '../lib/settingsContext'

export default function Notes() {
  const { t } = useI18n()
  const { label } = useSettings()
  const navigate = useNavigate()
  const { notes, loading, error, imageCounts } = useNotes()
  const [query, setQuery] = useState('')
  const [session, setSession] = useState('all')

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes.filter(
      (n) =>
        (session === 'all' || n.session === session) &&
        (!q ||
          [n.title, n.body, n.symbol, ...n.tags, ...n.tags.map((x) => label('tag', x))]
            .filter(Boolean)
            .some((s) => s!.toLowerCase().includes(q))),
    )
  }, [notes, query, session, label])

  if (loading) return <p className="text-muted">{t('common.loading')}</p>

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">{t('notes.title')}</h1>
        <select value={session} onChange={(e) => setSession(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg">
          <option value="all">{t('notes.allSessions')}</option>
          {SESSIONS.map((s) => (
            <option key={s} value={s}>
              {t(`session.${s}`)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          <Search size={16} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('notes.search')} className="w-56 bg-transparent text-fg outline-none placeholder:text-muted" />
        </label>
        <Link to="/notes/new" className="flex items-center gap-2 rounded-lg bg-green px-3 py-2 text-sm font-semibold text-black">
          <Plus size={16} /> {t('notes.new')}
        </Link>
      </div>

      {error && <p className="rounded-lg border border-warn p-3 text-sm text-warn">{t('notes.loadError', { error })}</p>}

      {shown.length === 0 && !error && <p className="py-10 text-center text-muted">{notes.length === 0 ? t('notes.empty') : t('notes.noMatch')}</p>}

      <ul className="space-y-3">
        {shown.map((n) => (
          <NoteCard key={n.id} note={n} shots={imageCounts[n.id] ?? 0} onOpen={() => navigate(`/notes/${n.id}`)} />
        ))}
      </ul>
    </div>
  )
}

function NoteCard({ note, shots, onOpen }: { note: Note; shots: number; onOpen: () => void }) {
  const { t, tn, locale } = useI18n()
  const { label } = useSettings()
  return (
    <li>
      <button onClick={onOpen} className="w-full space-y-2 rounded-xl border border-line bg-surface p-4 text-left hover:border-green/60">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-fg">
            {fmtDate(note.notedAt, locale)} {fmtTime(note.notedAt)}
          </span>
          {note.session && <span className="rounded-full border border-line px-2 py-0.5">{t(`session.${note.session}`)}</span>}
          {note.symbol && <span className="font-semibold">{note.symbol}</span>}
          {shots > 0 && (
            <span className="flex items-center gap-1">
              <Image size={14} /> {tn('notes.shots', shots)}
            </span>
          )}
        </div>
        <h2 className="font-semibold">{note.title ?? (note.body ? '' : t('notes.untitled'))}</h2>
        {note.body && <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted">{note.body}</p>}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                {label('tag', tag)}
              </span>
            ))}
          </div>
        )}
      </button>
    </li>
  )
}
