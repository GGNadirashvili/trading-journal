import { ImagePlus, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteImage, listImages, uploadImage, type TradeImage } from '../lib/imagesApi'

export default function ImageGallery({ tradeId }: { tradeId: string }) {
  const [images, setImages] = useState<TradeImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [open, setOpen] = useState<TradeImage | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listImages(tradeId)
      .then(setImages)
      .catch((e: Error) => setError(e.message))
  }, [tradeId])

  const addFiles = useCallback(
    async (files: File[]) => {
      const imgs = files.filter((f) => f.type.startsWith('image/'))
      if (!imgs.length) return
      setBusy(true)
      setError(null)
      try {
        for (const f of imgs) {
          const created = await uploadImage(tradeId, f)
          setImages((cur) => [...cur, created])
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(false)
      }
    },
    [tradeId],
  )

  // Paste a screenshot straight from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])]
      if (files.length) void addFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  async function remove(img: TradeImage) {
    if (!window.confirm('Delete this screenshot?')) return
    try {
      await deleteImage(img)
      setImages((cur) => cur.filter((i) => i.id !== img.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="font-semibold">Screenshots</h2>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void addFiles([...e.dataTransfer.files])
        }}
        onClick={() => fileInput.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm ${
          dragging ? 'border-green text-green' : 'border-line text-muted'
        }`}
      >
        <ImagePlus size={18} />
        {busy ? 'Uploading…' : 'Click, drop, or paste (Cmd+V) screenshots'}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void addFiles([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="text-sm text-loss">{error}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <img
                src={img.url}
                alt="Trade screenshot"
                onClick={() => setOpen(img)}
                className="aspect-video w-full cursor-zoom-in rounded-lg border border-line object-cover"
              />
              <button
                onClick={() => remove(img)}
                title="Delete screenshot"
                className="absolute right-1 top-1 hidden rounded-full bg-black/80 p-1 text-loss group-hover:block"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-4">
          <img src={open.url} alt="Trade screenshot" className="max-h-full max-w-full" />
        </div>
      )}
    </section>
  )
}
