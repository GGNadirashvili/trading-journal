import { DEMO, demoTrades } from './demo'
import { isSession, type Session } from './sessions'
import { supabase } from './supabase'
import type { Trade } from './types'

// Row shape as stored in Postgres (see supabase/migrations/0001_init.sql).
interface TradeRow {
  id: string
  symbol: string
  direction: 'long' | 'short'
  qty: number
  entry_price: number | null
  exit_price: number | null
  entry_time: string
  exit_time: string | null
  pnl: number
  setup: string | null
  tags: string[]
  emotion_before: string | null
  emotion_after: string | null
  emotion_tags: string[]
  notes: string | null
  session: string | null
  account_id: string | null
}

// numeric columns can come back as strings from PostgREST, so coerce them.
const num = (v: number | string | null) => (v === null ? null : Number(v))

const fromRow = (r: TradeRow): Trade => ({
  id: r.id,
  symbol: r.symbol,
  direction: r.direction,
  qty: r.qty,
  entryPrice: num(r.entry_price),
  exitPrice: num(r.exit_price),
  entryTime: r.entry_time,
  exitTime: r.exit_time,
  pnl: Number(r.pnl),
  setup: r.setup,
  tags: r.tags ?? [],
  emotionBefore: r.emotion_before,
  emotionAfter: r.emotion_after,
  emotionTags: r.emotion_tags ?? [],
  notes: r.notes,
  session: isSession(r.session) ? r.session : null,
  accountId: r.account_id ?? null,
})

export type TradeInput = Omit<Trade, 'id'>

const toRow = (t: TradeInput) => ({
  symbol: t.symbol,
  direction: t.direction,
  qty: t.qty,
  entry_price: t.entryPrice,
  exit_price: t.exitPrice,
  entry_time: t.entryTime,
  exit_time: t.exitTime,
  pnl: t.pnl,
  setup: t.setup,
  tags: t.tags,
  emotion_before: t.emotionBefore,
  emotion_after: t.emotionAfter,
  emotion_tags: t.emotionTags,
  notes: t.notes,
  session: t.session satisfies Session | null,
  account_id: t.accountId,
})

// In-memory store used only by demo mode.
let demoStore: Trade[] | null = null
const demo = () => (demoStore ??= demoTrades())

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function listTrades(): Promise<Trade[]> {
  if (DEMO) return [...demo()]
  const rows = check(await supabase.from('trades').select('*').order('entry_time', { ascending: false }))
  return (rows as TradeRow[]).map(fromRow)
}

export async function createTrade(input: TradeInput): Promise<Trade> {
  if (DEMO) {
    const t = { ...input, id: crypto.randomUUID() }
    demo().push(t)
    return t
  }
  return fromRow(check(await supabase.from('trades').insert(toRow(input)).select().single()) as TradeRow)
}

export async function updateTrade(id: string, input: TradeInput): Promise<Trade> {
  if (DEMO) {
    const t = { ...input, id }
    demoStore = demo().map((x) => (x.id === id ? t : x))
    return t
  }
  return fromRow(check(await supabase.from('trades').update(toRow(input)).eq('id', id).select().single()) as TradeRow)
}

export async function deleteTrade(id: string): Promise<void> {
  if (DEMO) {
    demoStore = demo().filter((x) => x.id !== id)
    return
  }
  check(await supabase.from('trades').delete().eq('id', id))
}

/** Puts every trade that has no account onto `accountId`. Returns how many trades were changed. */
export async function assignUnassignedTrades(accountId: string): Promise<number> {
  if (DEMO) {
    let n = 0
    demoStore = demo().map((t) => (t.accountId === null ? (n++, { ...t, accountId }) : t))
    return n
  }
  const rows = check(await supabase.from('trades').update({ account_id: accountId }).is('account_id', null).select('id'))
  return (rows as { id: string }[]).length
}
