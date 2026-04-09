import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useNavigate } from 'react-router-dom'
import './App.css'
import { DEMO_LOTS, parseNfcId } from './nfcLots'
import { loadStickers, saveStickers, type Sticker } from './stickers'

const DefaultMarkerIcon = new L.Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function makePhotoMarkerIcon(photoDataUrl: string) {
  return L.divIcon({
    className: 'photoMarker',
    html: `<img src="${photoDataUrl}" alt="" />`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
  })
}

function pickRandomStickerNumber(size: number) {
  return Math.max(1, Math.floor(Math.random() * size) + 1)
}

export default function MapView() {
  const navigate = useNavigate()

  const [stickers] = useState<Sticker[]>(() => loadStickers())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const [simNfcId, setSimNfcId] = useState<string>(() => {
    const lotId = DEMO_LOTS[0]?.id ?? 'bodegon-on-tour'
    const size = DEMO_LOTS[0]?.size ?? 100
    return `lot:${lotId}:sticker:${pickRandomStickerNumber(size)}`
  })

  const selectedSticker = useMemo(
    () => stickers.find((s) => s.id === selectedId) ?? null,
    [stickers, selectedId],
  )

  useEffect(() => {
    saveStickers(stickers)
  }, [stickers])

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedSticker) return [selectedSticker.lat, selectedSticker.lng]
    if (stickers.length > 0) return [stickers[0].lat, stickers[0].lng]
    return [40.4168, -3.7038]
  }, [selectedSticker, stickers])

  useEffect(() => {
    if (!selectedSticker) setDetailsOpen(false)
  }, [selectedSticker])

  function goToRegister(nfcId: string) {
    navigate(`/register?nfcId=${encodeURIComponent(nfcId)}`)
  }

  const simValid = useMemo(() => Boolean(parseNfcId(simNfcId)), [simNfcId])

  function generateRandomNfcId() {
    const lot = DEMO_LOTS[Math.floor(Math.random() * DEMO_LOTS.length)] ?? { id: 'bodegon-on-tour', size: 100 }
    const number = pickRandomStickerNumber(lot.size)
    setSimNfcId(`lot:${lot.id}:sticker:${number}`)
  }

  return (
    <main className="mapOnly">
      <MapContainer center={mapCenter} zoom={13} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stickers.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={s.photoDataUrl ? makePhotoMarkerIcon(s.photoDataUrl) : DefaultMarkerIcon}
            eventHandlers={{
              click: () => {
                setSelectedId(s.id)
                setDetailsOpen(true)
              },
            }}
          />
        ))}
      </MapContainer>

      <div className="mapOverlay">
        {selectedSticker ? (
          <div className="overlayPill">
            <strong>{selectedSticker.label}</strong> · {selectedSticker.lotName} #{selectedSticker.lotStickerNumber}
          </div>
        ) : (
          <div className="overlayPill">Mapa</div>
        )}
      </div>

      {detailsOpen && selectedSticker ? (
        <div
          className="detailsBackdrop"
          onClick={() => setDetailsOpen(false)}
          role="button"
          tabIndex={0}
        >
          <div className="detailsModal" onClick={(e) => e.stopPropagation()}>
            <div className="detailsTop">
              <div>
                <div className="detailsTitle">{selectedSticker.label}</div>
                <div className="detailsMeta">
                  {selectedSticker.authorName ? `Pegada por ${selectedSticker.authorName}` : 'Pegada por —'}
                </div>
              </div>
              <button className="ghost" onClick={() => setDetailsOpen(false)}>
                Cerrar
              </button>
            </div>

            {selectedSticker.photoDataUrl ? (
              <div className="detailsPhoto">
                <img src={selectedSticker.photoDataUrl} alt="" />
              </div>
            ) : (
              <div className="empty">Esta pegatina no tiene foto.</div>
            )}

            {selectedSticker.note ? (
              <div className="detailsNote">{selectedSticker.note}</div>
            ) : (
              <div className="detailsNote muted">Sin texto</div>
            )}
          </div>
        </div>
      ) : null}

      <div className="simNfcBox">
        <div className="simNfcTitle">Simular escaneo NFC (pruebas)</div>
        <label className="field">
          <span>nfcId (url param)</span>
          <input value={simNfcId} onChange={(e) => setSimNfcId(e.target.value)} />
        </label>

        <div className="row">
          <button className="ghost" onClick={generateRandomNfcId}>
            Aleatorio
          </button>
          <button className="primary" onClick={() => goToRegister(simNfcId)} disabled={!simValid}>
            Simular
          </button>
        </div>
      </div>
    </main>
  )
}

