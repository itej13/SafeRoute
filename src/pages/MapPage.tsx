import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { TILE_URL, TILE_URL_DARK, TILE_ATTRIBUTION, PHOTON_URL } from '../lib/config'
import { crimeForDistrict } from '../lib/crimeData'
import { findDistrict } from '../lib/geo'
import districts from '../data/delhi-districts.json'
import HeatmapLayer from '../components/HeatmapLayer'
import RatingPanel from '../components/RatingPanel'
import AreaSafetyCard from '../components/AreaSafetyCard'
import SOSButton from '../components/SOSButton'
import { useRouteComparison, RoutePolylines, RouteSheet } from '../components/RouteComparison'
import type { HeatCell, PhotonFeature } from '../lib/types'

const DELHI_CENTER: [number, number] = [28.6139, 77.209]

const userIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const startIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:#3EC98E;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const destinationIcon = L.divIcon({
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="36"><path fill="#E4576B" stroke="white" stroke-width="1.5" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/><circle fill="white" cx="12" cy="12" r="5"/></svg>',
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      const target = e.originalEvent?.target as HTMLElement | null
      if (target?.closest('[data-no-map-click]')) return
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Loads pre-aggregated heatmap cells for the (padded) viewport and refetches as
// the map moves — per-user egress is O(visible grid cells), not O(table size).
function RatingsLoader({
  refreshKey,
  onCells,
}: {
  refreshKey: number
  onCells: (cells: HeatCell[]) => void
}) {
  const map = useMap()
  const requestSeq = useRef(0)

  const load = useCallback(async () => {
    const seq = ++requestSeq.current
    const b = map.getBounds().pad(0.2)
    // Zero-area bounds = container not laid out yet; the deferred retry below refires
    if (b.getSouth() === b.getNorth()) return
    const { data, error } = await supabase.rpc('heatmap_cells', {
      min_lat: b.getSouth(),
      max_lat: b.getNorth(),
      min_lng: b.getWest(),
      max_lng: b.getEast(),
    })
    if (error || seq !== requestSeq.current) return // stale response — a newer pan won
    onCells(data ?? [])
  }, [map, onCells])

  useEffect(() => {
    load()
    const retry = setTimeout(() => {
      map.invalidateSize()
      load()
    }, 150) // first paint can beat Leaflet's size measurement
    return () => clearTimeout(retry)
  }, [load, refreshKey, map])

  useMapEvents({
    moveend() {
      load()
    },
  })
  return null
}

// Crime view: golden district patches on the dark basemap. Brightness follows the
// NCRB crime count — the district-level truth of the dataset, no fake point precision.
function CrimeGlowLayer() {
  return (
    <>
      {districts.map(d => {
        const crime = crimeForDistrict(d.name)
        if (!crime) return null
        const intensity = 1 - crime.safetyIndex / 100 // 0 = calmest district, 1 = heaviest
        return d.rings.map((ring, i) => (
          <Polygon
            key={`${d.name}-${i}`}
            positions={ring.map(([lng, lat]) => [lat, lng] as [number, number])}
            pathOptions={{
              color: '#FFB648',
              weight: 1,
              opacity: 0.25 + 0.5 * intensity,
              fillColor: '#FFB648',
              fillOpacity: 0.06 + 0.5 * intensity,
            }}
            interactive={false}
          />
        ))
      })}
    </>
  )
}

const labelOf = (f: PhotonFeature) =>
  [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')

interface SearchFieldProps {
  placeholder: string
  center: [number, number]
  /** null means "cleared" — caller decides the fallback */
  onPick: (point: [number, number] | null) => void
}

function SearchField({ placeholder, center, onPick }: SearchFieldProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [picked, setPicked] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (picked) return // the input holds a chosen label; don't search it again
    const q = query.trim().replace(/\s+/g, ' ')
    if (q.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        // lang=en + strong location bias: partial names rank Delhi results first
        const res = await fetch(
          `${PHOTON_URL}/api/?q=${encodeURIComponent(q)}&limit=6&lang=en` +
            `&lat=${center[0]}&lon=${center[1]}&zoom=12&location_bias_scale=0.4`,
          { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) }
        )
        if (!res.ok) return
        const data: { features?: PhotonFeature[] } = await res.json()
        setResults(data.features ?? [])
      } catch {
        // aborted or offline — keep previous results
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, center, picked])

  const pick = (f: PhotonFeature) => {
    const [lng, lat] = f.geometry.coordinates
    setQuery(labelOf(f))
    setPicked(true)
    setResults([])
    onPick([lat, lng])
  }

  const change = (value: string) => {
    setQuery(value)
    setPicked(false)
    if (value.trim() === '') onPick(null)
  }

  return (
    <div>
      <input
        value={query}
        onChange={e => change(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-night-600 bg-night-800/95 px-4 py-2.5 text-sm shadow-lg placeholder:text-mist-400 focus:border-lamp-400 focus:outline-none"
      />
      {results.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-xl border border-night-600 bg-night-800 shadow-lg">
          {results.map((f, i) => (
            <li key={`${f.properties.osm_id}-${i}`}>
              <button
                onClick={() => pick(f)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-night-700"
              >
                {labelOf(f)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MapPage() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [center, setCenter] = useState<[number, number] | null>(null)
  const [origin, setOrigin] = useState<[number, number] | null>(null)
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [ratingPoint, setRatingPoint] = useState<[number, number] | null>(null)
  const [heatCells, setHeatCells] = useState<HeatCell[]>([])
  const [ratingsRefresh, setRatingsRefresh] = useState(0)
  const [crimeView, setCrimeView] = useState(false)

  // Resolve GPS before mounting the map — MapContainer's center is fixed at mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => {
        const pos: [number, number] = [p.coords.latitude, p.coords.longitude]
        setUserPos(pos)
        setCenter(pos)
      },
      () => setCenter(DELHI_CENTER),
      { timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  // Empty start field → route from the user's current position
  const start = origin ?? userPos ?? center
  const { routes, loading: routesLoading } = useRouteComparison(start, destination)

  const areaCrime = userPos ? crimeForDistrict(findDistrict(userPos[0], userPos[1])) : null

  if (!center) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="font-display text-lg">Finding you…</p>
        <p className="text-sm text-mist-400">Allow location access to center the map on you</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <MapContainer center={center} zoom={15} zoomControl={false} className="h-full">
        {crimeView ? (
          <TileLayer key="dark" attribution={TILE_ATTRIBUTION} url={TILE_URL_DARK} />
        ) : (
          <TileLayer key="street" attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        )}
        <MapClickHandler onClick={(lat, lng) => setRatingPoint([lat, lng])} />
        <RatingsLoader refreshKey={ratingsRefresh} onCells={setHeatCells} />
        {crimeView ? <CrimeGlowLayer /> : <HeatmapLayer cells={heatCells} />}
        {userPos && <Marker position={userPos} icon={userIcon} />}
        {origin && <Marker position={origin} icon={startIcon} />}
        {destination && <Marker position={destination} icon={destinationIcon} />}
        {ratingPoint && <Marker position={ratingPoint} icon={destinationIcon} />}
        <RoutePolylines routes={routes} />
      </MapContainer>

      <div data-no-map-click className="absolute inset-x-4 top-4 z-[1000] ml-auto max-w-md space-y-1.5">
        <SearchField
          placeholder="Start — your location"
          center={center}
          onPick={setOrigin}
        />
        <SearchField placeholder="Where to?" center={center} onPick={setDestination} />
      </div>

      <div className="pointer-events-none absolute left-4 top-28 z-[1000]">
        <AreaSafetyCard crime={areaCrime} />
      </div>

      <button
        data-no-map-click
        onClick={() => setCrimeView(v => !v)}
        aria-pressed={crimeView}
        className={`absolute bottom-6 left-4 z-[1000] rounded-full px-4 py-2.5 text-xs font-semibold shadow-lg transition-colors ${
          crimeView ? 'bg-lamp-400 text-night-900' : 'bg-night-800/95 text-mist-100 border border-night-600'
        }`}
      >
        {crimeView ? 'Street view' : 'Crime map'}
      </button>
      {crimeView && (
        <div
          data-no-map-click
          className="pointer-events-none absolute bottom-24 right-4 z-[1000] w-44 rounded-lg bg-night-800/95 px-3 py-2.5 shadow-lg"
        >
          <div
            className="h-2 rounded-full"
            style={{
              background: 'linear-gradient(to right, rgba(255,182,72,0.08), rgba(255,182,72,0.95))',
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] text-mist-400">
            <span>Fewer crimes</span>
            <span>More</span>
          </div>
          <p className="mt-1 text-[9px] leading-snug text-mist-400">
            Reported crimes against women per district · NCRB 2015
          </p>
        </div>
      )}
      {!destination && !ratingPoint && !crimeView && (
        <p
          data-no-map-click
          className="pointer-events-none absolute bottom-20 left-4 z-[1000] max-w-52 rounded-lg bg-night-800/95 px-3 py-2 text-[11px] leading-snug text-mist-400"
        >
          Tap anywhere on the map to rate how safe that spot feels.
        </p>
      )}
      {!destination && !ratingPoint && <SOSButton />}

      {ratingPoint && (
        <RatingPanel
          lat={ratingPoint[0]}
          lng={ratingPoint[1]}
          onClose={() => setRatingPoint(null)}
          onSaved={() => {
            setRatingPoint(null)
            setRatingsRefresh(k => k + 1)
          }}
        />
      )}

      {!ratingPoint && (
        <RouteSheet routes={routes} loading={routesLoading} onClear={() => setDestination(null)} />
      )}
    </div>
  )
}
