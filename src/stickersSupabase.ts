import type { Sticker } from './stickers'
import { getSupabase } from './supabaseClient'

type StickerRow = {
  id: string
  label: string
  lat: number
  lng: number
  nfc_id: string
  lot_id: string
  lot_name: string
  lot_sticker_number: number
  author_name: string | null
  note: string | null
  photo_data_url: string | null
  created_at: string
}

function rowToSticker(r: StickerRow): Sticker {
  return {
    id: r.id,
    label: r.label,
    lat: r.lat,
    lng: r.lng,
    nfcId: r.nfc_id,
    lotId: r.lot_id,
    lotName: r.lot_name,
    lotStickerNumber: r.lot_sticker_number,
    authorName: r.author_name ?? undefined,
    note: r.note ?? undefined,
    photoDataUrl: r.photo_data_url ?? undefined,
    createdAt: r.created_at,
  }
}

function stickerToRow(s: Sticker): StickerRow {
  return {
    id: s.id,
    label: s.label,
    lat: s.lat,
    lng: s.lng,
    nfc_id: s.nfcId,
    lot_id: s.lotId,
    lot_name: s.lotName,
    lot_sticker_number: s.lotStickerNumber,
    author_name: s.authorName ?? null,
    note: s.note ?? null,
    photo_data_url: s.photoDataUrl ?? null,
    created_at: s.createdAt,
  }
}

export async function fetchStickersFromSupabase(): Promise<Sticker[]> {
  const sb = getSupabase()
  if (!sb) return []

  const { data, error } = await sb
    .from('stickers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as StickerRow[]).map(rowToSticker)
}

export async function insertStickerToSupabase(sticker: Sticker): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase no configurado')

  const { error } = await sb.from('stickers').insert(stickerToRow(sticker))
  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE_NFC')
    }
    throw error
  }
}
