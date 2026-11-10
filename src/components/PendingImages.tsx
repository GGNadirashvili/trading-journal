import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useI18n } from '../i18n/context'
import ImageDropZone from './ImageDropZone'

/** Screenshots chosen for something that is not saved yet. They are kept in memory and uploaded when it is saved. */
export default function PendingImages({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const { t } = useI18n()
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="font-semibold">{t('shots.title')}</h2>
      <ImageDropZone onFiles={(added) => onChange([...files, ...added])} />
      <p className="text-xs text-muted">{t('note.pendingHint')}</p>
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((p, i) => (
            <div key={p.url} className="group relative">
              <img src={p.url} alt={t('shots.alt')} className="aspect-video w-full rounded-lg border border-line object-cover" />
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} title={t('note.removePending')} className="absolute right-1 top-1 rounded-full bg-black/80 p-1 text-loss">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
