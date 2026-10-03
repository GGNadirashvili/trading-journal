import { pnlFromPrices } from './contracts'
import type { TradeInput } from './tradesApi'
import type { Direction } from './types'

/** Loose row shape accepted from the bulk grid or pasted JSON. Everything may be a string or a number. */
export interface RawRow {
  date?: string // YYYY-MM-DD
  time?: string // HH:MM, default 09:30
  exitTime?: string // HH:MM
  symbol?: string
  direction?: string // long/short, buy/sell, L/S
  qty?: string | number
  entry?: string | number
  exit?: string | number
  pnl?: string | number // net P&L; blank = computed from prices
  fees?: string | number
  setup?: string
  tags?: string | string[]
  emotionBefore?: string
  emotionAfter?: string
  emotionTags?: string | string[]
  notes?: string
}

export interface ParseResult {
  trades: TradeInput[]
  errors: string[] // "Row 3: ..." (rows are numbered from 1)
}

const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ''
const list = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v.map((x) => x.trim()).filter(Boolean) : (v ?? '').split(',').map((x) => x.trim()).filter(Boolean)

function direction(v: string | undefined): Direction | null {
  const d = (v ?? '').trim().toLowerCase()
  if (['long', 'l', 'buy', 'b'].includes(d)) return 'long'
  if (['short', 's', 'sell'].includes(d)) return 'short'
  return null
}

const atLocal = (date: string, time: string) => new Date(`${date}T${time.length === 5 ? time + ':00' : time}`)

export function parseRows(rows: RawRow[]): ParseResult {
  const trades: TradeInput[] = []
  const errors: string[] = []

  rows.forEach((r, i) => {
    const fail = (msg: string) => errors.push(`Row ${i + 1}: ${msg}`)

    if (!/^\d{4}-\d{2}-\d{2}$/.test((r.date ?? '').trim())) return fail('date must look like 2026-09-07')
    const time = blank(r.time) ? '09:30' : String(r.time).trim()
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return fail('time must look like 09:30')
    const entryTime = atLocal(r.date!.trim(), time)
    if (Number.isNaN(entryTime.getTime())) return fail('invalid date or time')

    const symbol = (r.symbol ?? '').trim().toUpperCase()
    if (!symbol) return fail('symbol is required')
    const dir = direction(r.direction)
    if (!dir) return fail('direction must be long or short')

    const qty = blank(r.qty) ? 1 : Number(r.qty)
    if (!Number.isInteger(qty) || qty < 1) return fail('qty must be a whole number, 1 or more')
    const num = (v: unknown) => (blank(v) ? null : Number(v))
    const entry = num(r.entry)
    const exit = num(r.exit)
    const fees = num(r.fees) ?? 0
    let net = num(r.pnl)
    if ([entry, exit, fees, net].some((x) => x !== null && Number.isNaN(x))) return fail('prices, fees and pnl must be numbers')

    if (net === null) {
      const gross = pnlFromPrices(symbol, dir, qty, entry, exit)
      if (gross === null) return fail('give pnl, or entry and exit prices for a known symbol (MNQ, ES, NQ, MES)')
      net = gross - fees
    }

    let exitTime: string | null = null
    if (!blank(r.exitTime)) {
      const x = atLocal(r.date!.trim(), String(r.exitTime).trim())
      if (Number.isNaN(x.getTime())) return fail('exitTime must look like 09:50')
      exitTime = x.toISOString()
    }

    const text = (v: string | undefined) => (blank(v) ? null : v!.trim())
    trades.push({
      symbol,
      direction: dir,
      qty,
      entryPrice: entry,
      exitPrice: exit,
      entryTime: entryTime.toISOString(),
      exitTime,
      status: 'closed',
      pnl: Math.round(net * 100) / 100,
      fees,
      setup: text(r.setup),
      tags: list(r.tags),
      emotionBefore: text(r.emotionBefore),
      emotionAfter: text(r.emotionAfter),
      emotionTags: list(r.emotionTags),
      notes: text(r.notes),
    })
  })
  return { trades, errors }
}

/** Parse pasted JSON: an array of rows, or an object with a `trades` array. */
export function parseJson(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { trades: [], errors: [`Not valid JSON: ${(e as Error).message}`] }
  }
  const rows = Array.isArray(data) ? data : (data as { trades?: unknown })?.trades
  if (!Array.isArray(rows)) return { trades: [], errors: ['Expected a JSON array of trades (or {"trades": [...]})'] }
  return parseRows(rows as RawRow[])
}
