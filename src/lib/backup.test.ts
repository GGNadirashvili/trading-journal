import { describe, expect, it } from 'vitest'
import type { Account } from './accounts'
import { buildBackup, csvCell, tradesToCsv } from './backup'
import type { Note } from './notesApi'
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

describe('buildBackup', () => {
  it('includes trades, reviews, accounts, notes, symbols and lists', () => {
    const account: Account = { id: 'a', name: 'Select 50k', startBalance: 50000, maxDrawdown: 2000, profitGoal: 53000, drawdownType: 'trailing_eod', adjustment: -1005.5, peakBaseline: 50034, manualStatus: null, manualClosedAt: null, openedAt: '2026-09-01' }
    const note: Note = { id: 'n', notedAt: '2026-09-07T09:40:00.000Z', title: 'Open', body: 'no setup', session: 'ny_am', symbol: 'MNQ', tags: [] }
    const b = buildBackup([], [], [{ id: 's', code: 'ES', pointValue: 50 }], [{ id: 'o', kind: 'emotion', name: 'calm', nameKa: null }], [account], [note])
    expect(b.accounts).toEqual([account])
    expect(b.notes).toEqual([note])
    expect(b.symbols).toEqual([{ code: 'ES', pointValue: 50 }]) // internal ids are left out
    expect(b.options).toEqual([{ kind: 'emotion', name: 'calm', nameKa: null }])
    expect(b.note).toContain('Screenshots are not included')
  })
})
