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
import { fetchStickersFromSupabase, insertStickerToSupabase } from './stickersSupabase'
import { isSupabaseConfigured } from './supabaseClient'

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

  const [stickers, setStickers] = useState<Sticker[]>(() =>
    isSupabaseConfigured() ? [] : loadStickers(),
  )
  const [listLoadError, setListLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [draftLatLng, setDraftLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [geoStatus, setGeoStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const parsed = useMemo(() => parseNfcId(nfcId), [nfcId])
  const lot = useMemo(() => (parsed ? getLotById(parsed.lotId) : null), [parsed])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isSupabaseConfigured()) return
      try {
        const data = await fetchStickersFromSupabase()
        if (!cancelled) {
          setStickers(data)
          setListLoadError(null)
        }
      } catch {
        if (!cancelled) setListLoadError('No se pudo conectar con el servidor.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured()) return
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
    setDraftLatLng(null)
    setPhotoDataUrl(null)
  }, [canStart, nfcId])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocalización no disponible.')
      return
    }
    setGeoStatus('Obteniendo ubicación…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoStatus(null)
      },
      () => {
        setGeoStatus('No se pudo obtener la ubicación. Selecciónala en el mapa.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30_000 },
    )
  }

  async function onPickPhoto(file: File) {
    if (!file.type.startsWith('image/')) return
    const maxBytes = 1_500_000
    const blob = file.size > maxBytes ? await downscaleImage(file, 1280, 0.82) : file
    const dataUrl = await fileToDataUrl(blob)
    setPhotoDataUrl(dataUrl)
  }

  async function registerSticker() {
    if (!canStart) return
    if (!draftLatLng) return
    if (!photoDataUrl) return

    if (!parsed || !lot) return

    setSubmitError(null)

    const sticker: Sticker = {
      id: newId(),
      label: `${lot.name} #${parsed.stickerNumber}`,
      lat: draftLatLng.lat,
      lng: draftLatLng.lng,
      nfcId,
      lotId: lot.id,
      lotName: lot.name,
      lotStickerNumber: parsed.stickerNumber,
      photoDataUrl,
      createdAt: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        await insertStickerToSupabase(sticker)
        navigate('/')
      } catch (e) {
        if (e instanceof Error && e.message === 'DUPLICATE_NFC') {
          setSubmitError('Esta pegatina ya está registrada.')
        } else {
          setSubmitError('No se pudo guardar. Revisa Supabase y vuelve a intentar.')
        }
      }
      return
    }

    setStickers((prev) => [sticker, ...prev])
    navigate('/')
  }

  return (
    <div className="registerShell">
      <div className="registerTop">
        <div>
          <div className="title">Registrar ubicación</div>
          <div className="subtitle">Rápido: ubicación + foto</div>
        </div>
        <button className="ghost" onClick={backHome}>
          Volver al mapa
        </button>
      </div>

      <div className="registerContent">
        {listLoadError ? <div className="empty">{listLoadError}</div> : null}

        <section className="card">
          <div className="cardTitle">Pegatina detectada</div>
          {!canStart ? (
            <div className="empty">NFC inválido o lote desconocido.</div>
          ) : (
            <div className="hint">
              Pegatina <strong>#{parsed!.stickerNumber}</strong> · <strong>{lot!.name}</strong>
            </div>
          )}

          {alreadyRegistered ? <div className="empty">Esta pegatina ya está registrada.</div> : null}
        </section>

        <section className="card">
          <div className="cardTitle">Registrar ubicación</div>
          <div className="hint">
            Selecciona la ubicación en el mapa (click para marcar).
            {draftLatLng ? (
              <>
                <br />
                <strong>Ubicación:</strong> {formatLatLng(draftLatLng.lat, draftLatLng.lng)}
              </>
            ) : null}
            {geoStatus ? (
              <>
                <br />
                <span style={{ opacity: 0.9 }}>{geoStatus}</span>
              </>
            ) : null}
          </div>

          <div className="row">
            <button className="ghost full" onClick={useMyLocation} disabled={!canStart || alreadyRegistered}>
              Usar la del móvil
            </button>
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
              {draftLatLng ? <Marker position={[draftLatLng.lat, draftLatLng.lng]} icon={DefaultMarkerIcon} /> : null}
            </MapContainer>
          </div>
        </section>

        <section className="card">
          <div className="cardTitle">Sacar una foto</div>
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
              {photoDataUrl ? 'Cambiar foto' : 'Hacer foto'}
            </button>
          </div>

          {!photoDataUrl ? <div className="empty">La foto es obligatoria.</div> : null}

          {photoDataUrl ? (
            <div className="photoPreview">
              <img src={photoDataUrl} alt="" />
            </div>
          ) : null}

          {submitError ? <div className="empty">{submitError}</div> : null}

          <div className="row">
            <button
              className="primary full"
              onClick={() => void registerSticker()}
              disabled={!canStart || alreadyRegistered || !draftLatLng || !photoDataUrl}
            >
              Guardar
            </button>
          </div>
        </section>
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

