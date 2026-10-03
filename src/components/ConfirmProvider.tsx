import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import { ConfirmContext, type Confirm, type ConfirmOptions } from '../lib/confirmContext'

interface Pending extends ConfirmOptions {
  message: string
  resolve: (answer: boolean) => void
}

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [pending, setPending] = useState<Pending | null>(null)
  const noButton = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<Confirm>(
    (message, options) =>
      new Promise<boolean>((resolve) => {
        // A second question replaces the first one, which counts as "No".
        setPending((cur) => {
          cur?.resolve(false)
          return { message, ...options, resolve }
        })
      }),
    [],
  )

  const answer = useCallback((value: boolean) => {
    setPending((cur) => {
      cur?.resolve(value)
      return null
    })
  }, [])

  useEffect(() => {
    if (!pending) return
    noButton.current?.focus() // the safe answer is focused, so a stray Enter cannot delete anything
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && answer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, answer])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div onClick={() => answer(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-line bg-surface p-5"
          >
            <h2 id="confirm-title" className="text-lg font-semibold">
              {pending.title ?? t('confirm.title')}
            </h2>
            <p className="whitespace-pre-line text-sm text-muted">{pending.message}</p>
            <div className="flex justify-end gap-2">
              <button ref={noButton} onClick={() => answer(false)} className="rounded-lg border border-line px-5 py-2 text-sm font-semibold hover:text-green">
                {t('confirm.no')}
              </button>
              <button
                onClick={() => answer(true)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold ${pending.danger ? 'bg-loss text-black' : 'bg-green text-black'}`}
              >
                {t('confirm.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
