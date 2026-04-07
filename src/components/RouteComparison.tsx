import { useState, useRef, useEffect, useCallback } from 'react'
import { Polyline } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { haversine, formatDistance, formatWalkTime, getBoundingBox } from '../lib/geo'
import type { NominatimResult, RouteData } from '../lib/types'

const VIBRANT_COLORS = [
  '#FF4757', '#2ED573', '#1E90FF', '#FF6348',
  '#A29BFE', '#FD79A8', '#00CEC9', '#FDCB6E',
  '#6C5CE7', '#26de81',
]

function pickColors(count: number): string[] {
  return [...VIBRANT_COLORS].sort(() => Math.random() - 0.5).slice(0, count)
}

// ── Polylines drawn inside MapContainer ──────────────────────────────────────

interface RoutePolylinesProps {
  routes: RouteData[]
  activeIndex: number | null
}

export function RoutePolylines({ routes, activeIndex }: RoutePolylinesProps) {
  return (
    <>
      {routes.map(route => (
        <Polyline
          key={route.index}
          positions={route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])}
          color={route.color}
          weight={activeIndex === route.index ? 7 : 4}
          opacity={activeIndex === null || activeIndex === route.index ? 0.92 : 0.28}
        />
      ))}
    </>
  )
}

// ── Safety scorer ─────────────────────────────────────────────────────────────

async function scoreRoute(coordinates: [number, number][]): Promise<number> {
  const bbox = getBoundingBox(coordinates)
  const { data } = await supabase
    .from('ratings')
    .select('lat, lng, safety_score')
    .gte('lat', bbox.minLat - 0.002)
    .lte('lat', bbox.maxLat + 0.002)
    .gte('lng', bbox.minLng - 0.002)
    .lte('lng', bbox.maxLng + 0.002)

  if (!data || data.length === 0) return 3

  const samples = coordinates.filter((_, i) => i % 8 === 0)
  const nearby = data.filter(r =>
    samples.some(([lng, lat]) => haversine(lat, lng, r.lat, r.lng) < 0.18)
  )
  if (nearby.length === 0) return 3
  return nearby.reduce((sum, r) => sum + r.safety_score, 0) / nearby.length
}

// ── Destination search with autocomplete ─────────────────────────────────────

interface DestSearchProps {
  onSelect: (r: NominatimResult) => void
  mapCenter: [number, number]
}

function DestSearch({ onSelect, mapCenter }: DestSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 3) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const [clat, clng] = mapCenter
        const delta = 0.5
        const viewbox = `${clng - delta},${clat + delta},${clng + delta},${clat - delta}`
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${viewbox}&bounded=0`,
          { headers: { 'Accept-Language': 'en' } }
        )
        setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, mapCenter])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
        <svg viewBox="0 0 24 24" fill="#9ca3af" className="w-4 h-4 flex-shrink-0">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search destination..."
          className="flex-1 bg-transparent text-sm text-secondary outline-none placeholder-gray-400"
          autoFocus
        />
        {loading && <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]) }} className="text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
          {results.map(r => (
            <li key={r.place_id}>
              <button
                onClick={() => { onSelect(r); setQuery(r.display_name.split(',')[0]); setResults([]) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0 transition-colors"
              >
                <p className="font-medium text-secondary truncate">{r.display_name.split(',')[0]}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {r.display_name.split(',').slice(1, 3).join(',')}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Safety badge ──────────────────────────────────────────────────────────────

function SafetyBadge({ score }: { score: number }) {
  const label = score >= 4 ? 'Safe' : score >= 3 ? 'Moderate' : 'Caution'
  const cls =
    score >= 4 ? 'bg-safe/10 text-safe' :
    score >= 3 ? 'bg-yellow-100 text-yellow-700' :
    'bg-primary/10 text-primary'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label} {score.toFixed(1)}★
    </span>
  )
}

// ── Main sheet ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  expanded: boolean
  onClose: () => void
  onMinimize: () => void
  onRoutesChange: (routes: RouteData[]) => void
  activeIndex: number | null
  onActiveChange: (i: number | null) => void
  mapCenter: [number, number]
}

export default function RouteComparisonSheet({
  isOpen, expanded, onClose, onMinimize, onRoutesChange, activeIndex, onActiveChange, mapCenter,
}: Props) {
  const [routes, setRoutes]           = useState<RouteData[]>([])
  const [destination, setDest]        = useState<NominatimResult | null>(null)
  const [fetching, setFetching]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [originLabel, setOriginLabel] = useState<string>('Your location')

  const fetchRoutes = useCallback(async (dest: NominatimResult) => {
    setFetching(true)
    setError(null)
    setRoutes([])
    onRoutesChange([])

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: oLat, longitude: oLng } = pos.coords
        setOriginLabel('Your location')
        const destLat = parseFloat(dest.lat)
        const destLng = parseFloat(dest.lon)

        try {
          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${oLng},${oLat};${destLng},${destLat}` +
            `?alternatives=true&overview=full&geometries=geojson`

          const res  = await fetch(url)
          const json = await res.json()

          if (json.code !== 'Ok' || !json.routes?.length) {
            setError('No routes found between these locations.')
            setFetching(false)
            return
          }

          const colors = pickColors(json.routes.length)

          const built: RouteData[] = await Promise.all(
            json.routes.map(async (
              r: { distance: number; duration: number; geometry: { coordinates: [number, number][] } },
              i: number
            ) => {
              const safety = await scoreRoute(r.geometry.coordinates)
              return {
                index: i,
                distance: r.distance,
                duration: r.duration,
                coordinates: r.geometry.coordinates,
                safetyScore: safety,
                color: colors[i],
              }
            })
          )

          built.sort((a, b) =>
            b.safetyScore !== a.safetyScore
              ? b.safetyScore - a.safetyScore
              : a.distance - b.distance
          )

          setRoutes(built)
          onRoutesChange(built)
          onActiveChange(built[0].index)
        } catch {
          setError('Failed to fetch routes. Check your connection.')
        } finally {
          setFetching(false)
        }
      },
      () => {
        setError('Location access denied. Enable GPS to compare routes.')
        setFetching(false)
      }
    )
  }, [onRoutesChange, onActiveChange])

  const handleDestSelect = (r: NominatimResult) => {
    setDest(r)
    fetchRoutes(r)
  }

  // Full close — clears routes from map
  const handleClose = () => {
    setRoutes([])
    setDest(null)
    setError(null)
    onRoutesChange([])
    onActiveChange(null)
    onClose()
  }

  // Minimized floating pill — routes stay on map
  if (isOpen && !expanded) {
    return (
      <div className="fixed bottom-[172px] left-4 right-20 z-[950] bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {routes.map(r => (
            <button
              key={r.index}
              onClick={() => onActiveChange(r.index)}
              title={`Route ${r.index + 1}`}
              className="rounded-full transition-all flex-shrink-0"
              style={{
                width: activeIndex === r.index ? 16 : 12,
                height: activeIndex === r.index ? 16 : 12,
                background: r.color,
                opacity: activeIndex === r.index || activeIndex === null ? 1 : 0.35,
              }}
            />
          ))}
          <span className="text-sm font-medium text-secondary ml-1 truncate">
            {routes.length > 0
              ? `${routes.length} route${routes.length > 1 ? 's' : ''} on map`
              : 'Routes'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">Tap ROUTES to expand</span>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 ml-1">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {isOpen && expanded && (
        <div className="fixed inset-0 bg-black/30 z-[900]" onClick={onMinimize} />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-[950] bg-white rounded-t-3xl shadow-2xl bottom-sheet ${
          isOpen && expanded ? 'bottom-sheet-visible' : 'bottom-sheet-hidden'
        }`}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="max-w-[480px] mx-auto px-5 py-6 pb-24">
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-secondary">Compare Routes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by safety score</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Minimise button */}
              <button
                onClick={onMinimize}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Minimise"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 13H5v-2h14v2z" />
                </svg>
              </button>
              {/* Close button */}
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Origin / Dest */}
          <div className="bg-gray-50 rounded-2xl p-3 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-safe flex-shrink-0" />
              <span className="text-sm text-secondary font-medium">{originLabel}</span>
            </div>
            <div className="ml-2.5 w-px h-3 bg-gray-300 mb-2" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1">
                <DestSearch onSelect={handleDestSelect} mapCenter={mapCenter} />
              </div>
            </div>
          </div>

          {fetching && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Finding safest routes...</p>
            </div>
          )}

          {error && !fetching && (
            <div className="bg-primary/5 rounded-xl px-4 py-3 text-sm text-primary">
              {error}
            </div>
          )}

          {!fetching && routes.length > 0 && (
            <div className="flex flex-col gap-3">
              {routes.map((route, rank) => {
                const isActive = activeIndex === route.index
                const distKm = route.distance / 1000
                return (
                  <button
                    key={route.index}
                    onClick={() => onActiveChange(isActive ? null : route.index)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-[0.98] ${
                      isActive ? 'shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                    style={isActive
                      ? { borderColor: route.color, backgroundColor: `${route.color}18` }
                      : {}
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                          style={{ background: route.color }}
                        />
                        <span className="font-bold text-secondary text-sm">
                          Route {String.fromCharCode(65 + rank)}
                          {rank === 0 && (
                            <span className="ml-1.5 text-[10px] bg-safe/10 text-safe font-semibold px-1.5 py-0.5 rounded-full">
                              Best
                            </span>
                          )}
                        </span>
                      </div>
                      <SafetyBadge score={route.safetyScore} />
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-accent">
                          <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5z" />
                        </svg>
                        {formatDistance(distKm)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-accent">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm.01 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                        </svg>
                        {formatWalkTime(distKm)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-safe">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                        Safety {route.safetyScore.toFixed(1)}/5
                      </span>
                    </div>
                  </button>
                )
              })}

              <p className="text-xs text-gray-400 text-center pt-1">
                Tap a route to highlight it · tap − to minimise
              </p>
            </div>
          )}

          {!fetching && !error && routes.length === 0 && destination === null && (
            <div className="flex flex-col items-center py-6 gap-2 text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mb-2">
                <svg viewBox="0 0 24 24" fill="#457B9D" className="w-7 h-7">
                  <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-secondary">Search a destination above</p>
              <p className="text-xs text-gray-400">We'll rank routes by safety score using crowd-sourced data</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
