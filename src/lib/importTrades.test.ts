import { describe, expect, it } from 'vitest'
import { parseJson, parseRows } from './importTrades'

const PV = { MNQ: 2, ES: 50 }

describe('parseRows', () => {
  it('parses a full row and computes P&L from prices', () => {
    const { trades, errors } = parseRows([
      { date: '2026-09-07', time: '09:45', symbol: 'mnq', direction: 'Buy', qty: '2', entry: '20000', exit: '20010', emotionTags: 'calm, focused' },
    ], PV)
    expect(errors).toEqual([])
    expect(trades[0]).toMatchObject({ symbol: 'MNQ', direction: 'long', qty: 2, pnl: 40, emotionTags: ['calm', 'focused'] })
    expect(new Date(trades[0].entryTime).getHours()).toBe(9) // local time, not UTC
  })
  it('lets an explicit pnl win and defaults time and qty', () => {
    const { trades } = parseRows([{ date: '2026-09-08', symbol: 'ES', direction: 's', pnl: '-120.5' }], PV)
    expect(trades[0]).toMatchObject({ direction: 'short', qty: 1, pnl: -120.5 })
    expect(new Date(trades[0].entryTime).getMinutes()).toBe(30)
  })
  it('reports every bad row with its number and keeps the good ones', () => {
    const { trades, errors } = parseRows([
      { date: '2026-09-07', symbol: 'MNQ', direction: 'long', pnl: 10 },
      { date: '09/07/2026', symbol: 'MNQ', direction: 'long', pnl: 10 },
      { date: '2026-09-07', symbol: 'MNQ', direction: 'up', pnl: 10 },
      { date: '2026-09-07', symbol: 'XYZ', direction: 'long', entry: 1, exit: 2 },
      { date: '2026-09-07', symbol: 'MNQ', direction: 'long', qty: 0, pnl: 1 },
    ], PV)
    expect(trades).toHaveLength(1)
    expect(errors).toHaveLength(4)
    expect(errors[0]).toMatch(/^Row 2: date/)
    expect(errors[1]).toMatch(/^Row 3: direction/)
    expect(errors[2]).toMatch(/^Row 4: give pnl/)
    expect(errors[3]).toMatch(/^Row 5: qty/)
  })
})

describe('parseJson', () => {
  it('accepts an array or {trades: []}', () => {
    const row = { date: '2026-09-07', symbol: 'ES', direction: 'long', pnl: 5 }
    expect(parseJson(JSON.stringify([row]), PV).trades).toHaveLength(1)
    expect(parseJson(JSON.stringify({ trades: [row] }), PV).trades).toHaveLength(1)
  })
  it('explains bad input', () => {
    expect(parseJson('{oops', PV).errors[0]).toMatch(/Not valid JSON/)
    expect(parseJson('{"a":1}', PV).errors[0]).toMatch(/Expected a JSON array/)
  })
})
