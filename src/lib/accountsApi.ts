import type { Account, DrawdownType } from './accounts'
import { DEMO, demoAccounts } from './demo'
import { DuplicateError } from './settingsApi'
import { supabase } from './supabase'

/** Everything about an account that you type in. The manual result is set separately. */
export type AccountInput = Omit<Account, 'id' | 'manualStatus' | 'manualClosedAt'>

interface Row {
  id: string
  name: string
  start_balance: number | string
  max_drawdown: number | string
  profit_goal: number | string
  drawdown_type: DrawdownType
  adjustment: number | string
  peak_baseline: number | string | null
  manual_status: 'passed' | 'failed' | null
  manual_closed_at: string | null
  opened_at: string
}

// numeric columns can arrive as strings, so coerce them
const fromRow = (r: Row): Account => ({
  id: r.id,
  name: r.name,
  startBalance: Number(r.start_balance),
  maxDrawdown: Number(r.max_drawdown),
  profitGoal: Number(r.profit_goal),
  drawdownType: r.drawdown_type,
  adjustment: Number(r.adjustment),
  peakBaseline: r.peak_baseline === null ? null : Number(r.peak_baseline),
  manualStatus: r.manual_status,
  manualClosedAt: r.manual_closed_at,
  openedAt: r.opened_at,
})

const toRow = (a: AccountInput) => ({
  name: a.name.trim(),
  start_balance: a.startBalance,
  max_drawdown: a.maxDrawdown,
  profit_goal: a.profitGoal,
  drawdown_type: a.drawdownType,
  adjustment: a.adjustment,
  peak_baseline: a.peakBaseline,
  opened_at: a.openedAt,
})

let demoStore: Account[] | null = null
const demo = () => (demoStore ??= demoAccounts())

function check<T>(res: { data: T | null; error: { message: string; code?: string } | null }, name?: string): T {
  if (res.error?.code === '23505' && name) throw new DuplicateError(name)
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function listAccounts(): Promise<Account[]> {
  if (DEMO) return [...demo()]
  const rows = check(await supabase.from('accounts').select('*').order('opened_at', { ascending: false }))
  return (rows as Row[]).map(fromRow)
}

export async function createAccount(input: AccountInput): Promise<Account> {
  if (DEMO) {
    if (demo().some((a) => a.name === input.name.trim())) throw new DuplicateError(input.name.trim())
    const a: Account = { ...input, name: input.name.trim(), id: crypto.randomUUID(), manualStatus: null, manualClosedAt: null }
    demo().push(a)
    return a
  }
  return fromRow(check(await supabase.from('accounts').insert(toRow(input)).select().single(), input.name.trim()) as Row)
}

export async function updateAccount(id: string, input: AccountInput): Promise<Account> {
  if (DEMO) {
    if (demo().some((a) => a.id !== id && a.name === input.name.trim())) throw new DuplicateError(input.name.trim())
    const old = demo().find((a) => a.id === id)!
    const a: Account = { ...old, ...input, name: input.name.trim() }
    demoStore = demo().map((x) => (x.id === id ? a : x))
    return a
  }
  return fromRow(check(await supabase.from('accounts').update(toRow(input)).eq('id', id).select().single(), input.name.trim()) as Row)
}

/** Sets a result by hand (passed or failed, on a date), or clears it with null. */
export async function setManualResult(id: string, status: 'passed' | 'failed' | null, closedAt: string | null): Promise<Account> {
  if (DEMO) {
    const old = demo().find((a) => a.id === id)!
    const a: Account = { ...old, manualStatus: status, manualClosedAt: status ? closedAt : null }
    demoStore = demo().map((x) => (x.id === id ? a : x))
    return a
  }
  const patch = { manual_status: status, manual_closed_at: status ? closedAt : null }
  return fromRow(check(await supabase.from('accounts').update(patch).eq('id', id).select().single()) as Row)
}

export async function deleteAccount(id: string): Promise<void> {
  if (DEMO) {
    demoStore = demo().filter((a) => a.id !== id)
    return
  }
  check(await supabase.from('accounts').delete().eq('id', id))
}
