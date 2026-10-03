import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title?: string
  /** Styles the Yes button red. Use for deletes and anything that cannot be undone. */
  danger?: boolean
}

export type Confirm = (message: string, options?: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<Confirm | null>(null)

/** Returns an async function that opens a Yes/No dialog and resolves true for Yes, false for No, Escape or a click outside. */
export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx
}
