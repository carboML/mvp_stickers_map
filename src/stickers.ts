export type Sticker = {
  id: string
  authorName?: string
  label: string
  lat: number
  lng: number
  nfcId: string
  lotId: string
  lotName: string
  lotStickerNumber: number
  note?: string
  photoDataUrl?: string
  createdAt: string
}

const STORAGE_KEY = 'stickers:v3'

export function loadStickers(): Sticker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSticker)
  } catch {
    return []
  }
}

export function saveStickers(stickers: Sticker[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers))
}

function isSticker(value: unknown): value is Sticker {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    (typeof v.authorName === 'string' || typeof v.authorName === 'undefined') &&
    typeof v.label === 'string' &&
    typeof v.lat === 'number' &&
    typeof v.lng === 'number' &&
    typeof v.nfcId === 'string' &&
    typeof v.lotId === 'string' &&
    typeof v.lotName === 'string' &&
    typeof v.lotStickerNumber === 'number' &&
    (typeof v.note === 'string' || typeof v.note === 'undefined') &&
    (typeof v.photoDataUrl === 'string' || typeof v.photoDataUrl === 'undefined') &&
    typeof v.createdAt === 'string' &&
    true
  )
}

