import { DEMO } from './demo'
import { isSession, type Session } from './sessions'
import { supabase } from './supabase'

/** A market note: something you wrote without opening a trade. */
export interface Note {
  id: string
  notedAt: string // ISO timestamp
  title: string | null
  body: string
  session: Session | null
  symbol: string | null
  tags: string[]
}

export type NoteInput = Omit<Note, 'id'>

interface Row {
  id: string
  noted_at: string
  title: string | null
  body: string
  session: string | null
  symbol: string | null
  tags: string[] | null
}

const fromRow = (r: Row): Note => ({
  id: r.id,
  notedAt: r.noted_at,
  title: r.title,
  body: r.body,
  session: isSession(r.session) ? r.session : null,
  symbol: r.symbol,
  tags: r.tags ?? [],
})

const toRow = (n: NoteInput) => ({ noted_at: n.notedAt, title: n.title, body: n.body, session: n.session, symbol: n.symbol, tags: n.tags })

let demoStore: Note[] | null = null
const demo = (): Note[] =>
  (demoStore ??= [
    { id: 'n1', notedAt: new Date(2026, 8, 10, 9, 40).toISOString(), title: 'Open: sellers in control', body: 'Opened the market, no setup.\nPDH rejected twice, waiting for a retest of the overnight low before I look at longs.', session: 'ny_am', symbol: 'MNQ', tags: [] },
    { id: 'n2', notedAt: new Date(2026, 8, 9, 3, 15).toISOString(), title: null, body: 'London swept the Asia low and reversed. Would have been a clean long, I was late.', session: 'london', symbol: 'ES', tags: [] },
  ])

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export async function listNotes(): Promise<Note[]> {
  if (DEMO) return [...demo()].sort((a, b) => b.notedAt.localeCompare(a.notedAt))
  const rows = check(await supabase.from('notes').select('*').order('noted_at', { ascending: false }))
  return (rows as Row[]).map(fromRow)
}

export async function createNote(input: NoteInput): Promise<Note> {
  if (DEMO) {
    const n = { ...input, id: crypto.randomUUID() }
    demo().push(n)
    return n
  }
  return fromRow(check(await supabase.from('notes').insert(toRow(input)).select().single()) as Row)
}

export async function updateNote(id: string, input: NoteInput): Promise<Note> {
  if (DEMO) {
    const n = { ...input, id }
    demoStore = demo().map((x) => (x.id === id ? n : x))
    return n
  }
  return fromRow(check(await supabase.from('notes').update(toRow(input)).eq('id', id).select().single()) as Row)
}

export async function deleteNote(id: string): Promise<void> {
  if (DEMO) {
    demoStore = demo().filter((x) => x.id !== id)
    return
  }
  check(await supabase.from('notes').delete().eq('id', id))
}
