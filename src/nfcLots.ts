export type NfcLot = {
  id: string
  name: string
  size: number
}

export const DEMO_LOTS: NfcLot[] = [
  { id: 'bodegon-on-tour', name: 'Bodegon on Tour', size: 100 },
  { id: 'street-pack-01', name: 'Street Pack 01', size: 50 },
]

export function makeNfcId(lotId: string, stickerNumber: number) {
  return `lot:${lotId}:sticker:${stickerNumber}`
}

export function parseNfcId(nfcId: string): { lotId: string; stickerNumber: number } | null {
  const m = /^lot:([^:]+):sticker:(\d+)$/.exec(nfcId)
  if (!m) return null
  return { lotId: m[1], stickerNumber: Number(m[2]) }
}

export function getLotById(lotId: string) {
  return DEMO_LOTS.find((l) => l.id === lotId) ?? null
}

