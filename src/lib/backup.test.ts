import { describe, expect, it } from 'vitest'
import { csvCell, tradesToCsv } from './backup'
import type { Trade } from './types'

describe('csv', () => {
  it('quotes cells with commas, quotes and line breaks', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
    expect(csvCell(null)).toBe('')
    expect(csvCell(0)).toBe('0')
  })
  it('writes a header and one row per trade with lists joined', () => {
    const t: Trade = {
      id: '1', symbol: 'ES', direction: 'short', qty: 1, entryPrice: 5000, exitPrice: 4995,
      entryTime: '2026-09-07T10:00:00.000Z', exitTime: null, pnl: 250, setup: null,
      tags: ['trend', 'news'], emotionBefore: 'calm, focused', emotionAfter: null, emotionTags: ['calm'], notes: null, session: 'ny_am', accountId: null,
    }
    const lines = tradesToCsv([t]).split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0].startsWith('entry_time,exit_time,symbol')).toBe(true)
    expect(lines[0]).toContain(',session,')
    expect(lines[1]).toBe('2026-09-07T10:00:00.000Z,,ES,short,1,5000,4995,250,ny_am,,trend; news,calm,"calm, focused",,')
  })
})
