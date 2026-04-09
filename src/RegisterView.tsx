import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'
import { getLotById, parseNfcId } from './nfcLots'
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

function newId() {
  return crypto.randomUUID()
}

function formatLatLng(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function RegisterView() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nfcId = params.get('nfcId') ?? ''

  const [stickers, setStickers] = useState<Sticker[]>(() => loadStickers())

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [draftAuthorName, setDraftAuthorName] = useState('')
  const [draftLabel, setDraftLabel] = useState('')
  const [draftNote, setDraftNote] = useState('')
  const [draftLatLng, setDraftLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const parsed = useMemo(() => parseNfcId(nfcId), [nfcId])
  const lot = useMemo(() => (parsed ? getLotById(parsed.lotId) : null), [parsed])

  useEffect(() => {
    saveStickers(stickers)
  }, [stickers])

  const alreadyRegistered = useMemo(
    () => stickers.some((s) => s.nfcId === nfcId),
    [stickers, nfcId],
  )

  function backHome() {
    navigate('/')
  }

  const canStart = Boolean(nfcId && parsed && lot)

  useEffect(() => {
    if (!canStart) return
    setStep(1)
  }, [canStart, nfcId])

  async function onPickPhoto(file: File) {
    if (!file.type.startsWith('image/')) return
    const maxBytes = 1_500_000
    const blob = file.size > maxBytes ? await downscaleImage(file, 1280, 0.82) : file
    const dataUrl = await fileToDataUrl(blob)
    setPhotoDataUrl(dataUrl)
  }

  function registerSticker() {
    if (!canStart) return
    if (!draftLatLng) return
    const authorName = draftAuthorName.trim()
    if (!authorName) return
    const label = draftLabel.trim()
    if (!label) return
    if (!photoDataUrl) return

    if (!parsed || !lot) return

    const sticker: Sticker = {
      id: newId(),
      authorName,
      label,
      lat: draftLatLng.lat,
      lng: draftLatLng.lng,
      nfcId,
      lotId: lot.id,
      lotName: lot.name,
      lotStickerNumber: parsed.stickerNumber,
      note: draftNote.trim() || undefined,
      photoDataUrl,
      createdAt: new Date().toISOString(),
    }

    setStickers((prev) => [sticker, ...prev])
    navigate('/')
  }

  return (
    <div className="registerShell">
      <div className="registerTop">
        <div>
          <div className="title">Registrar pegatina</div>
          <div className="subtitle">Sigue los pasos (sin mapa)</div>
        </div>
        <button className="ghost" onClick={backHome}>
          Volver al mapa
        </button>
      </div>

      <div className="registerContent">
        <section className="card">
          <div className="cardTitle">Progreso</div>
          <div className="steps">
            <div className={step === 1 ? 'step active' : 'step'}>Step 1</div>
            <div className={step === 2 ? 'step active' : 'step'}>Step 2</div>
            <div className={step === 3 ? 'step active' : 'step'}>Step 3</div>
          </div>

          {alreadyRegistered ? <div className="empty">Esta pegatina ya está registrada.</div> : null}
        </section>

        {step === 1 ? (
          <section className="card">
            <div className="cardTitle">Step 1 · Confirmación</div>
            {!canStart ? (
              <div className="empty">NFC inválido o lote desconocido.</div>
            ) : (
              <>
                <div className="hint">
                  Estás a punto de registrar la pegatina número <strong>#{parsed!.stickerNumber}</strong> del lote{' '}
                  <strong>{lot!.name}</strong>.
                  <br />
                  <span style={{ opacity: 0.8 }}>ID: {nfcId}</span>
                </div>
                <button className="primary full" onClick={() => setStep(2)} disabled={alreadyRegistered}>
                  Empezar
                </button>
              </>
            )}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="card">
            <div className="cardTitle">Step 2 · ¿Dónde está?</div>
            <div className="hint">
              Selecciona la ubicación en el mapa (click para marcar).
              {draftLatLng ? (
                <>
                  <br />
                  <strong>Ubicación:</strong> {formatLatLng(draftLatLng.lat, draftLatLng.lng)}
                </>
              ) : null}
            </div>

            <div className="miniMapWrap">
              <MapContainer
                center={draftLatLng ? [draftLatLng.lat, draftLatLng.lng] : [40.4168, -3.7038]}
                zoom={13}
                className="miniMap"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickToPick
                  onPick={(lat, lng) => {
                    if (!canStart || alreadyRegistered) return
                    setDraftLatLng({ lat, lng })
                  }}
                />
                {draftLatLng ? (
                  <Marker position={[draftLatLng.lat, draftLatLng.lng]} icon={DefaultMarkerIcon} />
                ) : null}
              </MapContainer>
            </div>

            <div className="row">
              <button className="ghost" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button className="primary" onClick={() => setStep(3)} disabled={!draftLatLng || alreadyRegistered}>
                Continuar
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="card">
            <div className="cardTitle">Step 3 · Foto + texto</div>
            <label className="field">
              <span>Tu nombre</span>
              <input
                value={draftAuthorName}
                onChange={(e) => setDraftAuthorName(e.target.value)}
                placeholder="Ej: Pablo"
                disabled={!canStart || alreadyRegistered}
              />
            </label>

            <label className="field">
              <span>Título</span>
              <input
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="Ej: Bodegón: esquina izquierda"
                disabled={!canStart || alreadyRegistered}
              />
            </label>

            <label className="field">
              <span>Texto (opcional)</span>
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Ej: Pegada el 8/4, al lado de la farola…"
                disabled={!canStart || alreadyRegistered}
              />
            </label>

            <div className="row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hiddenFile"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onPickPhoto(f)
                }}
                disabled={!canStart || alreadyRegistered}
              />
              <button
                className="ghost full"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canStart || alreadyRegistered}
              >
                {photoDataUrl ? 'Cambiar foto' : 'Añadir foto'}
              </button>
            </div>

            {!photoDataUrl ? (
              <div className="empty">La foto es obligatoria para guardar.</div>
            ) : null}

            {photoDataUrl ? (
              <div className="photoPreview">
                <img src={photoDataUrl} alt="" />
              </div>
            ) : null}

            <div className="row">
              <button className="ghost" onClick={() => setStep(2)}>
                Atrás
              </button>
              <button
                className="primary"
                onClick={registerSticker}
                disabled={
                  !canStart ||
                  alreadyRegistered ||
                  !draftLatLng ||
                  !draftAuthorName.trim() ||
                  !draftLabel.trim() ||
                  !photoDataUrl
                }
              >
                Guardar
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function fileToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}

async function downscaleImage(file: File, maxSide: number, quality: number) {
  const dataUrl = await fileToDataUrl(file)
  const img = document.createElement('img')
  img.src = dataUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Imagen inválida'))
  })

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  )
  return blob ?? file
}

