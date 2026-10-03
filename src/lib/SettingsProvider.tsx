import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from './settingsApi'
import { SettingsContext, type SettingsState } from './settingsContext'
import { DEFAULT_EMOTIONS, DEFAULT_SYMBOLS, type OptionItem, type OptionKind, type SymbolDef } from './settingsTypes'

const fallbackSymbols: SymbolDef[] = DEFAULT_SYMBOLS.map((s) => ({ ...s, id: `default-${s.code}` }))
const fallbackOptions: OptionItem[] = DEFAULT_EMOTIONS.map((name) => ({ id: `default-${name}`, kind: 'emotion', name }))

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [symbols, setSymbols] = useState<SymbolDef[]>(fallbackSymbols)
  const [options, setOptions] = useState<OptionItem[]>(fallbackOptions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.listSymbols(), api.listOptions()])
      .then(([s, o]) => {
        setSymbols(s)
        setOptions(o)
      })
      .catch((e: Error) => setError(e.message)) // keep the built-in defaults
      .finally(() => setLoading(false))
  }, [])

  const addSymbol = useCallback(async (code: string, pointValue: number) => {
    const s = await api.addSymbol(code, pointValue)
    setSymbols((cur) => [...cur, s].sort((a, b) => a.code.localeCompare(b.code)))
  }, [])
  const updateSymbol = useCallback(async (id: string, pointValue: number) => {
    await api.updateSymbol(id, pointValue)
    setSymbols((cur) => cur.map((s) => (s.id === id ? { ...s, pointValue } : s)))
  }, [])
  const removeSymbol = useCallback(async (id: string) => {
    await api.deleteSymbol(id)
    setSymbols((cur) => cur.filter((s) => s.id !== id))
  }, [])
  const addOption = useCallback(async (kind: OptionKind, name: string) => {
    const o = await api.addOption(kind, name)
    setOptions((cur) => [...cur, o].sort((a, b) => a.name.localeCompare(b.name)))
  }, [])
  const removeOption = useCallback(async (id: string) => {
    await api.deleteOption(id)
    setOptions((cur) => cur.filter((o) => o.id !== id))
  }, [])

  const value = useMemo<SettingsState>(
    () => ({
      loading,
      error,
      symbols,
      pointValues: Object.fromEntries(symbols.map((s) => [s.code, s.pointValue])),
      options,
      optionNames: (kind) => options.filter((o) => o.kind === kind).map((o) => o.name),
      addSymbol,
      updateSymbol,
      removeSymbol,
      addOption,
      removeOption,
    }),
    [loading, error, symbols, options, addSymbol, updateSymbol, removeSymbol, addOption, removeOption],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
