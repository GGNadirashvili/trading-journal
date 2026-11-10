import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/context'

/** A box where screenshots are added by clicking, dropping files on it, or pasting from the clipboard (Cmd+V). */
export default function ImageDropZone({ onFiles, busy = false }: { onFiles: (files: File[]) => void; busy?: boolean }) {
  const { t } = useI18n()
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (files.length) onFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onFiles])

  const pick = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (images.length) onFiles(images)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        pick([...e.dataTransfer.files])
      }}
      onClick={() => fileInput.current?.click()}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm ${dragging ? 'border-green text-green' : 'border-line text-muted'}`}
    >
      <ImagePlus size={18} />
      {busy ? t('shots.uploading') : t('shots.drop')}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          pick([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
    </div>
  )
}
