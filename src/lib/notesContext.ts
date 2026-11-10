import { createContext, useContext } from 'react'
import type { Note, NoteInput } from './notesApi'

export interface NotesState {
  notes: Note[]
  loading: boolean
  /** Set when the notes table cannot be read (for example migration 0008 has not been run). */
  error: string | null
  /** How many screenshots each note has: { noteId: count }. */
  imageCounts: Record<string, number>
  add: (input: NoteInput) => Promise<Note>
  update: (id: string, input: NoteInput) => Promise<void>
  /** Deletes the note, its screenshot records and its image files. */
  remove: (id: string) => Promise<void>
  /** Re-reads the screenshot counts (after screenshots were added or removed). */
  refreshCounts: () => Promise<void>
}

export const NotesContext = createContext<NotesState | null>(null)

export function useNotes(): NotesState {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider')
  return ctx
}
