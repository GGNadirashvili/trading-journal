import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageGallery from '../components/ImageGallery'
import NoteForm from '../components/NoteForm'
import PendingImages from '../components/PendingImages'
import { useI18n } from '../i18n/context'
import { useConfirm } from '../lib/confirmContext'
import { uploadImage } from '../lib/imagesApi'
import type { NoteInput } from '../lib/notesApi'
import { useNotes } from '../lib/notesContext'

/** Used for both /notes/new and /notes/:id. A new note keeps its screenshots in memory and uploads them when it is saved. */
export default function NoteEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const confirm = useConfirm()
  const { notes, loading, imageCounts, add, update, remove, refreshCounts } = useNotes()
  const existing = id ? notes.find((n) => n.id === id) : undefined
  const [pending, setPending] = useState<File[]>([])
  const [shotCount, setShotCount] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (id && !existing) return <p className="text-loss">{t('note.notFound')}</p>

  async function save(input: NoteInput) {
    if (existing) {
      await update(existing.id, input)
      await refreshCounts()
      navigate('/notes')
      return
    }
    const created = await add(input)
    let failure: string | null = null
    for (const file of pending) {
      try {
        await uploadImage({ kind: 'note', id: created.id }, file)
      } catch (e) {
        failure = (e as Error).message
        break
      }
    }
    await refreshCounts()
    if (failure) {
      // The note is saved; stay on its page so the screenshot can be added again.
      setWarning(t('note.screenshotFailed', { error: failure }))
      navigate(`/notes/${created.id}`, { replace: true })
      return
    }
    navigate('/notes')
  }

  async function del() {
    if (existing && (await confirm(t('note.deleteBody'), { title: t('note.deleteTitle'), danger: true }))) {
      await remove(existing.id)
      navigate('/notes')
    }
  }

  const savedShots = existing ? (shotCount ?? imageCounts[existing.id] ?? 0) : 0

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{existing ? t('note.edit') : t('note.new')}</h1>
        {existing && (
          <button onClick={del} className="flex items-center gap-2 text-sm text-loss hover:underline">
            <Trash2 size={16} /> {t('common.delete')}
          </button>
        )}
      </div>
      {warning && <p className="rounded-lg border border-warn p-3 text-sm text-warn">{warning}</p>}
      <NoteForm key={existing?.id ?? 'new'} initial={existing} hasExtraContent={existing ? savedShots > 0 : pending.length > 0} onSubmit={save} onCancel={() => navigate('/notes')}>
        {existing ? <ImageGallery owner={{ kind: 'note', id: existing.id }} onCountChange={setShotCount} /> : <PendingImages files={pending} onChange={setPending} />}
      </NoteForm>
    </div>
  )
}
