import { DEMO } from './demo'
import { DEFAULT_EMOTIONS, DEFAULT_SYMBOLS, type OptionItem, type OptionKind, type SymbolDef } from './settingsTypes'
import { supabase } from './supabase'

/** A symbol or list item with that name already exists. Carries the name so the UI can word it in the current language. */
export class DuplicateError extends Error {
  itemName: string
  constructor(itemName: string) {
    super(`${itemName} already exists`)
    this.itemName = itemName
  }
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

// Demo-mode stores (in memory only).
let demoSymbols: SymbolDef[] | null = null
let demoOptions: OptionItem[] | null = null
const demoSym = () => (demoSymbols ??= DEFAULT_SYMBOLS.map((s) => ({ ...s, id: crypto.randomUUID() })))
const demoOpt = () =>
  (demoOptions ??= DEFAULT_EMOTIONS.map((name) => ({ id: crypto.randomUUID(), kind: 'emotion' as const, name })))

interface SymbolRow {
  id: string
  code: string
  point_value: number | string
}
const symFromRow = (r: SymbolRow): SymbolDef => ({ id: r.id, code: r.code, pointValue: Number(r.point_value) })

export async function listSymbols(): Promise<SymbolDef[]> {
  if (DEMO) return [...demoSym()]
  const rows = check(await supabase.from('symbols').select('id, code, point_value').order('code'))
  return (rows as SymbolRow[]).map(symFromRow)
}

export async function addSymbol(code: string, pointValue: number): Promise<SymbolDef> {
  const clean = code.trim().toUpperCase()
  if (DEMO) {
    if (demoSym().some((s) => s.code === clean)) throw new DuplicateError(clean)
    const s = { id: crypto.randomUUID(), code: clean, pointValue }
    demoSym().push(s)
    return s
  }
  const res = await supabase.from('symbols').insert({ code: clean, point_value: pointValue }).select('id, code, point_value').single()
  if (res.error?.code === '23505') throw new DuplicateError(clean)
  return symFromRow(check(res) as SymbolRow)
}

export async function updateSymbol(id: string, pointValue: number): Promise<void> {
  if (DEMO) {
    demoSymbols = demoSym().map((s) => (s.id === id ? { ...s, pointValue } : s))
    return
  }
  check(await supabase.from('symbols').update({ point_value: pointValue }).eq('id', id))
}

export async function deleteSymbol(id: string): Promise<void> {
  if (DEMO) {
    demoSymbols = demoSym().filter((s) => s.id !== id)
    return
  }
  check(await supabase.from('symbols').delete().eq('id', id))
}

export async function listOptions(): Promise<OptionItem[]> {
  if (DEMO) return [...demoOpt()]
  const rows = check(await supabase.from('options').select('id, kind, name').order('name'))
  return rows as OptionItem[]
}

export async function addOption(kind: OptionKind, name: string): Promise<OptionItem> {
  const clean = name.trim()
  if (DEMO) {
    if (demoOpt().some((o) => o.kind === kind && o.name === clean)) throw new DuplicateError(clean)
    const o = { id: crypto.randomUUID(), kind, name: clean }
    demoOpt().push(o)
    return o
  }
  const res = await supabase.from('options').insert({ kind, name: clean }).select('id, kind, name').single()
  if (res.error?.code === '23505') throw new DuplicateError(clean)
  return check(res) as OptionItem
}

export async function deleteOption(id: string): Promise<void> {
  if (DEMO) {
    demoOptions = demoOpt().filter((o) => o.id !== id)
    return
  }
  check(await supabase.from('options').delete().eq('id', id))
}
