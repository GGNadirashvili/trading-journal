import { translate } from '../i18n/translate'
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
  (demoOptions ??= DEFAULT_EMOTIONS.map((name) => ({ id: crypto.randomUUID(), kind: 'emotion' as const, name, nameKa: translate('ka', `emotion.${name}`) })))

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

interface OptionRow {
  id: string
  kind: OptionKind
  name: string
  name_ka?: string | null
}
const optFromRow = (r: OptionRow): OptionItem => ({ id: r.id, kind: r.kind, name: r.name, nameKa: r.name_ka ?? null })

export async function listOptions(): Promise<OptionItem[]> {
  if (DEMO) return [...demoOpt()]
  const res = await supabase.from('options').select('id, kind, name, name_ka').order('name')
  // Migration 0003 not run yet: the column is missing. Load without it so the app keeps working.
  if (res.error?.code === '42703') {
    return (check(await supabase.from('options').select('id, kind, name').order('name')) as OptionRow[]).map(optFromRow)
  }
  return (check(res) as OptionRow[]).map(optFromRow)
}

export async function addOption(kind: OptionKind, name: string, nameKa: string): Promise<OptionItem> {
  const clean = name.trim()
  const cleanKa = nameKa.trim()
  if (DEMO) {
    const list = demoOpt()
    if (list.some((o) => o.kind === kind && o.name === clean)) throw new DuplicateError(clean)
    if (list.some((o) => o.kind === kind && o.nameKa === cleanKa)) throw new DuplicateError(cleanKa)
    const o = { id: crypto.randomUUID(), kind, name: clean, nameKa: cleanKa }
    list.push(o)
    return o
  }
  const res = await supabase.from('options').insert({ kind, name: clean, name_ka: cleanKa }).select('id, kind, name, name_ka').single()
  if (res.error?.code === '23505') throw new DuplicateError(res.error.message.includes('name_ka') ? cleanKa : clean)
  return optFromRow(check(res) as OptionRow)
}

/** Change only the Georgian name. The English name is what trades store, so it is never renamed. */
export async function updateOptionKa(id: string, nameKa: string): Promise<void> {
  const clean = nameKa.trim()
  if (DEMO) {
    const list = demoOpt()
    const me = list.find((o) => o.id === id)
    if (me && list.some((o) => o.id !== id && o.kind === me.kind && o.nameKa === clean)) throw new DuplicateError(clean)
    demoOptions = list.map((o) => (o.id === id ? { ...o, nameKa: clean } : o))
    return
  }
  const res = await supabase.from('options').update({ name_ka: clean }).eq('id', id)
  if (res.error?.code === '23505') throw new DuplicateError(clean)
  check(res)
}

export async function deleteOption(id: string): Promise<void> {
  if (DEMO) {
    demoOptions = demoOpt().filter((o) => o.id !== id)
    return
  }
  check(await supabase.from('options').delete().eq('id', id))
}
