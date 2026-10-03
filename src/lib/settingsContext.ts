import { createContext, useContext } from 'react'
import type { OptionItem, OptionKind, SymbolDef } from './settingsTypes'

export interface SettingsState {
  loading: boolean
  /** Set when the settings tables could not be read (for example the migration has not been run). Defaults are used. */
  error: string | null
  symbols: SymbolDef[]
  /** code -> dollars per point, for P&L calculation. */
  pointValues: Record<string, number>
  options: OptionItem[]
  optionNames: (kind: OptionKind) => string[]
  addSymbol: (code: string, pointValue: number) => Promise<void>
  updateSymbol: (id: string, pointValue: number) => Promise<void>
  removeSymbol: (id: string) => Promise<void>
  addOption: (kind: OptionKind, name: string) => Promise<void>
  removeOption: (id: string) => Promise<void>
}

export const SettingsContext = createContext<SettingsState | null>(null)

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
