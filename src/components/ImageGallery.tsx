import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n/context'
import { useConfirm } from '../lib/confirmContext'
import { deleteImage, listImages, uploadImage, type ImageOwner, type StoredImage } from '../lib/imagesApi'
import ImageDropZone from './ImageDropZone'

/** Screenshots of a saved trade or note: add, view full size, delete. */
export default function ImageGallery({ owner, onCountChange }: { owner: ImageOwner; onCountChange?: (count: number) => void }) {
  const confirm = useConfirm()
  const { t } = useI18n()
  const [images, setImages] = useState<StoredImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<StoredImage | null>(null)

  const { kind, id } = owner

  useEffect(() => {
    listImages({ kind, id })
      .then(setImages)
      .catch((e: Error) => setError(e.message))
  }, [kind, id])

  useEffect(() => onCountChange?.(images.length), [images.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback(
    async (files: File[]) => {
      setBusy(true)
      setError(null)
      try {
        for (const f of files) {
          const created = await uploadImage({ kind, id }, f)
          setImages((cur) => [...cur, created])
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(false)
      }
    },
    [kind, id],
  )

  async function remove(img: StoredImage) {
    if (!(await confirm(t('shots.deleteBody'), { title: t('shots.deleteTitle'), danger: true }))) return
    try {
      await deleteImage(kind, img)
      setImages((cur) => cur.filter((i) => i.id !== img.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="font-semibold">{t('shots.title')}</h2>
      <ImageDropZone onFiles={addFiles} busy={busy} />
      {error && <p className="text-sm text-loss">{error}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <img src={img.url} alt={t('shots.alt')} onClick={() => setOpen(img)} className="aspect-video w-full cursor-zoom-in rounded-lg border border-line object-cover" />
              <button onClick={() => remove(img)} title={t('shots.deleteTitle')} className="absolute right-1 top-1 hidden rounded-full bg-black/80 p-1 text-loss group-hover:block">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-4">
          <img src={open.url} alt={t('shots.alt')} className="max-h-full max-w-full" />
        </div>
      )}
    </section>
  )
}
