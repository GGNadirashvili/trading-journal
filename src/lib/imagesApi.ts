import { DEMO } from './demo'
import { supabase } from './supabase'

export interface TradeImage {
  id: string
  tradeId: string
  path: string
  url: string // short-lived signed URL (or object URL in demo mode)
}

const BUCKET = 'screenshots'
const SIGNED_SECONDS = 60 * 60

const demoImages: TradeImage[] = []

export async function listImages(tradeId: string): Promise<TradeImage[]> {
  if (DEMO) return demoImages.filter((i) => i.tradeId === tradeId)
  const { data, error } = await supabase
    .from('trade_images')
    .select('id, trade_id, storage_path')
    .eq('trade_id', tradeId)
    .order('created_at')
  if (error) throw new Error(error.message)
  if (!data.length) return []
  const signed = await supabase.storage.from(BUCKET).createSignedUrls(
    data.map((r) => r.storage_path as string),
    SIGNED_SECONDS,
  )
  if (signed.error) throw new Error(signed.error.message)
  return data.map((r, i) => ({
    id: r.id as string,
    tradeId: r.trade_id as string,
    path: r.storage_path as string,
    url: signed.data[i]?.signedUrl ?? '',
  }))
}

export async function uploadImage(tradeId: string, file: File): Promise<TradeImage> {
  if (DEMO) {
    const img = { id: crypto.randomUUID(), tradeId, path: file.name, url: URL.createObjectURL(file) }
    demoImages.push(img)
    return img
  }
  const { data: sess } = await supabase.auth.getSession()
  const userId = sess.session?.user.id
  if (!userId) throw new Error('Not signed in')
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  // The first path segment must be the user id: the storage policy checks it.
  const path = `${userId}/${tradeId}/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (up.error) throw new Error(up.error.message)
  const ins = await supabase.from('trade_images').insert({ trade_id: tradeId, storage_path: path }).select('id').single()
  if (ins.error) {
    await supabase.storage.from(BUCKET).remove([path]) // don't leave an orphan file
    throw new Error(ins.error.message)
  }
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_SECONDS)
  if (signed.error) throw new Error(signed.error.message)
  return { id: ins.data.id as string, tradeId, path, url: signed.data.signedUrl }
}

export async function deleteImage(img: TradeImage): Promise<void> {
  if (DEMO) {
    demoImages.splice(demoImages.findIndex((i) => i.id === img.id), 1)
    return
  }
  const del = await supabase.from('trade_images').delete().eq('id', img.id)
  if (del.error) throw new Error(del.error.message)
  await supabase.storage.from(BUCKET).remove([img.path])
}
