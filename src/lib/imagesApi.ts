import { DEMO } from './demo'
import { supabase } from './supabase'

/** Screenshots belong to a trade or to a market note. */
export type ImageOwner = { kind: 'trade' | 'note'; id: string }

export interface StoredImage {
  id: string
  ownerId: string
  path: string
  url: string // short-lived signed URL (or object URL in demo mode)
}

const BUCKET = 'screenshots'
const SIGNED_SECONDS = 60 * 60
const TABLE = { trade: 'trade_images', note: 'note_images' } as const
const FK = { trade: 'trade_id', note: 'note_id' } as const

const demoImages: (StoredImage & { kind: ImageOwner['kind'] })[] = []

export async function listImages(owner: ImageOwner): Promise<StoredImage[]> {
  if (DEMO) return demoImages.filter((i) => i.kind === owner.kind && i.ownerId === owner.id)
  const { data, error } = await supabase.from(TABLE[owner.kind]).select(`id, ${FK[owner.kind]}, storage_path`).eq(FK[owner.kind], owner.id).order('created_at')
  if (error) throw new Error(error.message)
  const rows = data as unknown as { id: string; storage_path: string }[]
  if (!rows.length) return []
  const signed = await supabase.storage.from(BUCKET).createSignedUrls(
    rows.map((r) => r.storage_path),
    SIGNED_SECONDS,
  )
  if (signed.error) throw new Error(signed.error.message)
  return rows.map((r, i) => ({ id: r.id, ownerId: owner.id, path: r.storage_path, url: signed.data[i]?.signedUrl ?? '' }))
}

export async function uploadImage(owner: ImageOwner, file: File): Promise<StoredImage> {
  if (DEMO) {
    const img = { id: crypto.randomUUID(), ownerId: owner.id, kind: owner.kind, path: file.name, url: URL.createObjectURL(file) }
    demoImages.push(img)
    return img
  }
  const { data: sess } = await supabase.auth.getSession()
  const userId = sess.session?.user.id
  if (!userId) throw new Error('Not signed in')
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  // The first path segment must be the user id: the storage policy checks it.
  const path = `${userId}/${owner.kind === 'note' ? 'notes/' : ''}${owner.id}/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (up.error) throw new Error(up.error.message)
  const ins = await supabase.from(TABLE[owner.kind]).insert({ [FK[owner.kind]]: owner.id, storage_path: path }).select('id').single()
  if (ins.error) {
    await supabase.storage.from(BUCKET).remove([path]) // don't leave an orphan file
    throw new Error(ins.error.message)
  }
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_SECONDS)
  if (signed.error) throw new Error(signed.error.message)
  return { id: ins.data.id as string, ownerId: owner.id, path, url: signed.data.signedUrl }
}

export async function deleteImage(kind: ImageOwner['kind'], img: StoredImage): Promise<void> {
  if (DEMO) {
    demoImages.splice(demoImages.findIndex((i) => i.id === img.id), 1)
    return
  }
  const del = await supabase.from(TABLE[kind]).delete().eq('id', img.id)
  if (del.error) throw new Error(del.error.message)
  await supabase.storage.from(BUCKET).remove([img.path])
}

/**
 * Deleting a trade or a note removes its screenshot RECORDS automatically, but not the image FILES, which would stay in
 * storage and use up the free space. This looks up the files first, runs the delete, and then removes the files.
 * If removing a file fails the delete still stands (a leftover file is a cost, not an error).
 */
export async function deleteWithImages(owner: ImageOwner, deleteOwner: () => Promise<void>): Promise<void> {
  if (DEMO) {
    await deleteOwner()
    for (let i = demoImages.length - 1; i >= 0; i--) if (demoImages[i].kind === owner.kind && demoImages[i].ownerId === owner.id) demoImages.splice(i, 1)
    return
  }
  const { data } = await supabase.from(TABLE[owner.kind]).select('storage_path').eq(FK[owner.kind], owner.id)
  const paths = ((data ?? []) as { storage_path: string }[]).map((r) => r.storage_path)
  await deleteOwner()
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}

/** How many screenshots each note has, as { noteId: count }, from one cheap query (no image is downloaded). */
export async function noteImageCounts(): Promise<Record<string, number>> {
  if (DEMO) {
    const out: Record<string, number> = {}
    for (const i of demoImages) if (i.kind === 'note') out[i.ownerId] = (out[i.ownerId] ?? 0) + 1
    return out
  }
  const { data, error } = await supabase.from('note_images').select('note_id')
  if (error) throw new Error(error.message)
  const out: Record<string, number> = {}
  for (const r of data as { note_id: string }[]) out[r.note_id] = (out[r.note_id] ?? 0) + 1
  return out
}
