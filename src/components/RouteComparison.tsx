import { useEffect, useState } from 'react'
import { Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { haversine, formatDistance, formatDuration, findDistrict } from '../lib/geo'
import { crimeForDistrict, type DistrictCrime } from '../lib/crimeData'
import type { Rating, RouteData } from '../lib/types'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'
// ponytail: public OSRM only serves the driving profile; point at a self-hosted
// instance with a foot profile for true walking routes
const PROFILE = 'driving'

const RATING_RADIUS_M = 250
const BBOX_BUFFER_DEG = 0.0025 // ≈ 250 m, keeps edge ratings inside the single query

interface OsrmRoute {
  distance: number
  duration: number
  geometry: { coordinates: [number, number][] } // [lng, lat]
}

async function fetchRatingsAround(routes: RouteData[]): Promise<Rating[]> {
  const lats = routes.flatMap(r => r.coords.map(c => c[0]))
  const lngs = routes.flatMap(r => r.coords.map(c => c[1]))
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .gte('lat', Math.min(...lats) - BBOX_BUFFER_DEG)
    .lte('lat', Math.max(...lats) + BBOX_BUFFER_DEG)
    .gte('lng', Math.min(...lngs) - BBOX_BUFFER_DEG)
    .lte('lng', Math.max(...lngs) + BBOX_BUFFER_DEG)
  if (error) return []
  return data ?? []
}

// Crowd score: average of ratings within RATING_RADIUS_M of the route.
// Coords are sampled — adjacent OSRM points are far closer than the radius.
function crowdScore(coords: [number, number][], ratings: Rating[]): number | null {
  const sampled = coords.filter((_, i) => i % 5 === 0)
  const near = ratings.filter(r =>
    sampled.some(([lat, lng]) => haversine(lat, lng, r.lat, r.lng) <= RATING_RADIUS_M)
  )
  if (near.length === 0) return null
  return near.reduce((sum, r) => sum + r.score, 0) / near.length
}

// District base score: NCRB safety index (0–100) of districts the route touches, on a 1–5 scale
function districtScore(
  coords: [number, number][],
  crimeIndex: Map<string, DistrictCrime> | null
): number | null {
  if (!crimeIndex) return null
  const probes = [coords[0], coords[Math.floor(coords.length / 2)], coords[coords.length - 1]]
  const indices = probes
    .map(([lat, lng]) => crimeForDistrict(crimeIndex, findDistrict(lat, lng)))
    .filter((c): c is DistrictCrime => c !== null)
    .map(c => c.safetyIndex)
  if (indices.length === 0) return null
  const avg = indices.reduce((a, b) => a + b, 0) / indices.length
  return 1 + (avg / 100) * 4
}

function blend(crowd: number | null, district: number | null): number | null {
  if (crowd !== null && district !== null) return 0.6 * crowd + 0.4 * district
  return crowd ?? district
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRouteComparison(
  origin: [number, number] | null,
  destination: [number, number] | null,
  crimeIndex: Map<string, DistrictCrime> | null
) {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!origin || !destination) {
      setRoutes([])
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const url =
          `${OSRM_BASE}/${PROFILE}/${origin[1]},${origin[0]};${destination[1]},${destination[0]}` +
          `?alternatives=true&overview=full&geometries=geojson`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`OSRM ${res.status}`)
        const data: { routes?: OsrmRoute[] } = await res.json()
        const base: RouteData[] = (data.routes ?? []).map(r => ({
          coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
          distanceMeters: r.distance,
          durationSeconds: r.duration,
          safetyScore: null,
        }))
        if (base.length === 0) throw new Error('no routes')

        const ratings = await fetchRatingsAround(base)
        const scored = base.map(r => ({
          ...r,
          safetyScore: blend(crowdScore(r.coords, ratings), districtScore(r.coords, crimeIndex)),
        }))
        if (!cancelled) setRoutes(scored)
      } catch {
        if (!cancelled) setRoutes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [origin, destination, crimeIndex])

  return { routes, loading }
}

function routeRoles(routes: RouteData[]): { safestIdx: number; fastestIdx: number } {
  let safestIdx = 0
  let fastestIdx = 0
  routes.forEach((r, i) => {
    if ((r.safetyScore ?? 0) > (routes[safestIdx].safetyScore ?? 0)) safestIdx = i
    if (r.durationSeconds < routes[fastestIdx].durationSeconds) fastestIdx = i
  })
  return { safestIdx, fastestIdx }
}

export function RoutePolylines({ routes }: { routes: RouteData[] }) {
  const map = useMap()

  // Zoom out to show every alternative once routes arrive
  useEffect(() => {
    if (routes.length === 0) return
    const bounds = L.latLngBounds(routes.flatMap(r => r.coords))
    map.fitBounds(bounds, { padding: [40, 40], paddingBottomRight: [40, 180] })
  }, [routes, map])

  if (routes.length === 0) return null
  const { safestIdx } = routeRoles(routes)
  return (
    <>
      {routes.map((r, i) => (
        <Polyline
          key={i}
          positions={r.coords}
          pathOptions={{
            color: i === safestIdx ? '#3EC98E' : '#FFB648',
            weight: i === safestIdx ? 6 : 4,
            opacity: i === safestIdx ? 0.95 : 0.7,
          }}
        />
      ))}
    </>
  )
}

interface SheetProps {
  routes: RouteData[]
  loading: boolean
  onClear: () => void
}

export function RouteSheet({ routes, loading, onClear }: SheetProps) {
  if (!loading && routes.length === 0) return null
  const { safestIdx, fastestIdx } = routeRoles(routes)

  return (
    <div
      data-no-map-click
      className="absolute inset-x-0 bottom-0 z-[1000] rounded-t-2xl border-t border-night-600 bg-night-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg">Routes</h2>
        <button onClick={onClear} className="text-sm text-mist-400 hover:text-mist-100">
          Clear
        </button>
      </div>

      {loading ? (
        <p className="py-3 text-sm text-mist-400">Comparing routes…</p>
      ) : (
        <ul className="space-y-2">
          {routes.map((r, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg bg-night-700 px-3 py-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: i === safestIdx ? '#3EC98E' : '#FFB648' }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {formatDistance(r.distanceMeters)} · {formatDuration(r.durationSeconds)}
                </p>
                <p className="text-xs text-mist-400">
                  {r.safetyScore !== null
                    ? `Safety ${r.safetyScore.toFixed(1)}/5`
                    : 'No safety data yet — be the first to rate this area'}
                </p>
              </div>
              <div className="flex gap-1">
                {i === safestIdx && routes.length > 1 && (
                  <span className="rounded-full bg-safe/20 px-2 py-0.5 text-[10px] font-semibold text-safe">
                    SAFEST
                  </span>
                )}
                {i === fastestIdx && (
                  <span className="rounded-full bg-lamp-400/20 px-2 py-0.5 text-[10px] font-semibold text-lamp-400">
                    FASTEST
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
