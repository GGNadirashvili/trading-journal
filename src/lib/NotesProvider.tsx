import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { deleteWithImages, noteImageCounts } from './imagesApi'
import * as api from './notesApi'
import { NotesContext, type NotesState } from './notesContext'

const newestFirst = (a: api.Note, b: api.Note) => b.notedAt.localeCompare(a.notedAt)

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<api.Note[]>([])
  const [imageCounts, setImageCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshCounts = useCallback(async () => {
    setImageCounts(await noteImageCounts().catch(() => ({})))
  }, [])

  useEffect(() => {
    Promise.all([api.listNotes(), noteImageCounts().catch(() => ({}))])
      .then(([n, counts]) => {
        setNotes(n)
        setImageCounts(counts)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const add = useCallback(async (input: api.NoteInput) => {
    const n = await api.createNote(input)
    setNotes((cur) => [...cur, n].sort(newestFirst))
    return n
  }, [])
  const update = useCallback(async (id: string, input: api.NoteInput) => {
    const n = await api.updateNote(id, input)
    setNotes((cur) => cur.map((x) => (x.id === id ? n : x)).sort(newestFirst))
  }, [])
  const remove = useCallback(async (id: string) => {
    await deleteWithImages({ kind: 'note', id }, () => api.deleteNote(id))
    setNotes((cur) => cur.filter((x) => x.id !== id))
    setImageCounts((cur) => {
      const { [id]: _gone, ...rest } = cur
      return rest
    })
  }, [])

  const value = useMemo<NotesState>(() => ({ notes, loading, error, imageCounts, add, update, remove, refreshCounts }), [notes, loading, error, imageCounts, add, update, remove, refreshCounts])
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}
