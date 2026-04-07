import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import HeatmapLayer from '../components/HeatmapLayer'
import RatingPanel from '../components/RatingPanel'
import SOSButton from '../components/SOSButton'
import RouteComparisonSheet, { RoutePolylines } from '../components/RouteComparison'
import { haversine, formatDistance } from '../lib/geo'
import type { NominatimResult, RouteData } from '../lib/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DTU_CENTER: [number, number] = [28.7501, 77.1177]

// ── Map click handler ─────────────────────────────────────────────────────────

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

// ── GPS fly-to button ─────────────────────────────────────────────────────────

function FlyToControl() {
  const map = useMap()
  return (
    <button
      onClick={() =>
        navigator.geolocation.getCurrentPosition(
          p => map.flyTo([p.coords.latitude, p.coords.longitude], 17, { duration: 1.5 }),
          () => {}
        )
      }
      className="absolute bottom-36 left-4 z-[1000] w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all"
      aria-label="My location"
    >
      <svg viewBox="0 0 24 24" fill="#1D3557" className="w-5 h-5">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
      </svg>
    </button>
  )
}

// ── Search bar with autocomplete + distance display ───────────────────────────

interface SearchBarProps {
  onLocationSelected: (r: NominatimResult) => void
}

function SearchBar({ onLocationSelected }: SearchBarProps) {
  const map = useMap()
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<NominatimResult[]>([])
  const [loading, setLoading]   = useState(false)
  const [distLabel, setDistLabel] = useState<string | null>(null)
  const [open, setOpen]         = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced Nominatim search — 5 results
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 3) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const bounds = map.getBounds()
        const viewbox = `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${viewbox}&bounded=0`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 320)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Prevent Leaflet map click events when interacting with search UI
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current)
      L.DomEvent.disableScrollPropagation(containerRef.current)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    map.flyTo([lat, lng], 16, { duration: 1.5 })
    setQuery(r.display_name.split(',')[0])
    setOpen(false)
    setResults([])
    onLocationSelected(r)

    // Compute distance from current GPS
    setDistLabel(null)
    navigator.geolocation.getCurrentPosition(pos => {
      const km = haversine(pos.coords.latitude, pos.coords.longitude, lat, lng)
      setDistLabel(`${formatDistance(km)} from you`)
    })
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-4 right-4 z-[1000]"
      onClick={e => e.stopPropagation()}
    >
      {/* Input row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setDistLabel(null) }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search a place..."
            className="w-full bg-white rounded-2xl pl-4 pr-10 py-3 text-sm text-secondary shadow-lg outline-none placeholder-gray-400 border border-gray-100 focus:ring-2 focus:ring-accent"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
          {!loading && query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setOpen(false); setDistLabel(null) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Distance chip */}
      {distLabel && (
        <div className="mt-2 ml-1 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow text-xs text-accent font-medium">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5z" />
          </svg>
          {distLabel}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {open && results.length > 0 && (
        <ul className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {results.map(r => (
            <li key={r.place_id}>
              <button
                onMouseDown={e => { e.preventDefault(); selectResult(r) }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0 transition-colors"
              >
                <p className="text-sm font-medium text-secondary truncate">
                  {r.display_name.split(',')[0]}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {r.display_name.split(',').slice(1, 3).join(', ')}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Place action card (shown after search selection) ─────────────────────────

function PlaceCard({
  place,
  onRate,
  onDirections,
  onClose,
}: {
  place: NominatimResult
  onRate: () => void
  onDirections: () => void
  onClose: () => void
}) {
  const parts = place.display_name.split(',')
  const name = parts[0]
  const address = parts.slice(1, 3).join(', ')

  return (
    <div className="fixed bottom-[72px] left-4 right-4 z-[1001] bg-white rounded-2xl shadow-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-bold text-secondary text-base truncate">{name}</p>
          {address && <p className="text-xs text-gray-400 mt-0.5 truncate">{address}</p>}
        </div>
        <button onClick={onClose} className="text-gray-400 flex-shrink-0 p-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRate}
          className="flex-1 py-2.5 rounded-xl bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          Rate Place
        </button>
        <button
          onClick={onDirections}
          className="flex-1 py-2.5 rounded-xl bg-secondary text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
          </svg>
          Directions
        </button>
      </div>
    </div>
  )
}

// ── Routes FAB ────────────────────────────────────────────────────────────────

function RoutesFAB({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-44 right-4 z-[999] w-16 h-16 text-white rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all ${
        active ? 'bg-accent ring-2 ring-white ring-offset-2 ring-offset-accent' : 'bg-secondary'
      }`}
      aria-label="Compare routes"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
      </svg>
      <span className="text-[9px] font-bold leading-none">ROUTES</span>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [selectedPoint, setSelectedPoint]   = useState<{ lat: number; lng: number } | null>(null)
  const [searchedPlace, setSearchedPlace]   = useState<NominatimResult | null>(null)
  const [preFilledDest, setPreFilledDest]   = useState<NominatimResult | null>(null)
  const [refreshKey, setRefreshKey]         = useState(0)
  const [routeCompareOpen, setRouteCompareOpen] = useState(false)
  const [sheetExpanded, setSheetExpanded]   = useState(true)
  const [routes, setRoutes]                 = useState<RouteData[]>([])
  const [activeRouteIdx, setActiveRouteIdx] = useState<number | null>(null)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!routeCompareOpen) {
      setSelectedPoint({ lat, lng })
      setSearchedPlace(null)
    }
  }, [routeCompareOpen])

  const handleSubmitted = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <div className="fixed inset-0" style={{ paddingBottom: '64px' }}>
      <MapContainer
        center={DTU_CENTER}
        zoom={15}
        zoomControl={false}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer refreshKey={refreshKey} />
        <ClickHandler onMapClick={handleMapClick} />
        <SearchBar onLocationSelected={r => { setSearchedPlace(r); setSelectedPoint(null) }} />
        <FlyToControl />
        <RoutePolylines routes={routes} activeIndex={activeRouteIdx} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 z-[999] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-3 h-3 rounded-full bg-[#2A9D8F] inline-block" />
          <span className="text-gray-600">Safe</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-3 h-3 rounded-full bg-[#e9c46a] inline-block" />
          <span className="text-gray-600">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E63946] inline-block" />
          <span className="text-gray-600">Unsafe</span>
        </div>
      </div>

      <RoutesFAB
        active={routeCompareOpen}
        onClick={() => {
          if (routeCompareOpen) {
            setSheetExpanded(true)   // re-expand if minimised
          } else {
            setRouteCompareOpen(true)
            setSheetExpanded(true)
          }
        }}
      />
      <SOSButton />

      {searchedPlace && (
        <PlaceCard
          place={searchedPlace}
          onRate={() => {
            setSelectedPoint({ lat: parseFloat(searchedPlace.lat), lng: parseFloat(searchedPlace.lon) })
            setSearchedPlace(null)
          }}
          onDirections={() => {
            setPreFilledDest(searchedPlace)
            setSearchedPlace(null)
            setRouteCompareOpen(true)
            setSheetExpanded(true)
          }}
          onClose={() => setSearchedPlace(null)}
        />
      )}

      <RatingPanel
        lat={selectedPoint?.lat ?? null}
        lng={selectedPoint?.lng ?? null}
        onClose={() => setSelectedPoint(null)}
        onSubmitted={handleSubmitted}
      />

      <RouteComparisonSheet
        isOpen={routeCompareOpen}
        expanded={sheetExpanded}
        onClose={() => { setRouteCompareOpen(false); setSheetExpanded(true) }}
        onMinimize={() => setSheetExpanded(false)}
        onRoutesChange={setRoutes}
        activeIndex={activeRouteIdx}
        onActiveChange={setActiveRouteIdx}
        mapCenter={DTU_CENTER}
        preFilledDest={preFilledDest}
        onPreFilledConsumed={() => setPreFilledDest(null)}
      />
    </div>
  )
}
