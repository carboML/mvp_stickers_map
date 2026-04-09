const KEY = 'scanTicket:v1'
const TTL_MS = 2 * 60 * 1000

export type ScanTicket = {
  nfcId: string
  createdAtMs: number
}

export function issueScanTicket(nfcId: string) {
  const ticket: ScanTicket = { nfcId, createdAtMs: Date.now() }
  sessionStorage.setItem(KEY, JSON.stringify(ticket))
  return ticket
}

export function consumeValidScanTicket(expectedNfcId: string) {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as ScanTicket
    const ok =
      typeof parsed?.nfcId === 'string' &&
      typeof parsed?.createdAtMs === 'number' &&
      parsed.nfcId === expectedNfcId &&
      Date.now() - parsed.createdAtMs <= TTL_MS
    if (ok) {
      sessionStorage.removeItem(KEY)
      return true
    }
    return false
  } catch {
    return false
  }
}

