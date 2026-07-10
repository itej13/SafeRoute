import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { fetchDelhiCrimeIndex, crimeForDistrict, type DistrictCrime } from '../lib/crimeData'
import { findDistrict } from '../lib/geo'
import HeatmapLayer from '../components/HeatmapLayer'
import RatingPanel from '../components/RatingPanel'
import AreaSafetyCard from '../components/AreaSafetyCard'
import SOSButton from '../components/SOSButton'
import { useRouteComparison, RoutePolylines, RouteSheet } from '../components/RouteComparison'
import type { PhotonFeature, Rating } from '../lib/types'

const DELHI_CENTER: [number, number] = [28.6139, 77.209]

const userIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
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

function SearchBar({
  center,
  onSelect,
}: {
  center: [number, number]
  onSelect: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PhotonFeature[]>([])
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lat=${center[0]}&lon=${center[1]}`,
          { signal: controller.signal }
        )
        if (!res.ok) return
        const data: { features?: PhotonFeature[] } = await res.json()
        setResults(data.features ?? [])
      } catch {
        // aborted or offline — keep previous results
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, center])

  const pick = (f: PhotonFeature) => {
    const [lng, lat] = f.geometry.coordinates
    setQuery('')
    setResults([])
    map.flyTo([lat, lng], 15, { duration: 1 })
    onSelect(lat, lng)
  }

  const labelOf = (f: PhotonFeature) =>
    [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')

  return (
    <div data-no-map-click className="absolute inset-x-4 top-4 z-[1000] ml-auto max-w-md">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Where to?"
        aria-label="Search destination"
        className="w-full rounded-xl border border-night-600 bg-night-800/95 px-4 py-3 text-sm shadow-lg placeholder:text-mist-400 focus:border-lamp-400 focus:outline-none"
      />
      {results.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-xl border border-night-600 bg-night-800 shadow-lg">
          {results.map(f => (
            <li key={f.properties.osm_id}>
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
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [ratingPoint, setRatingPoint] = useState<[number, number] | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [crimeIndex, setCrimeIndex] = useState<Map<string, DistrictCrime> | null>(null)

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

  const loadRatings = useCallback(async () => {
    // ponytail: loads all ratings; switch to viewport-bounded queries when rows grow
    const { data } = await supabase.from('ratings').select('*')
    setRatings(data ?? [])
  }, [])

  useEffect(() => {
    loadRatings()
    fetchDelhiCrimeIndex().then(setCrimeIndex)
  }, [loadRatings])

  // Route origin falls back to map center so search still works without GPS
  const { routes, loading: routesLoading } = useRouteComparison(userPos ?? center, destination, crimeIndex)

  const areaCrime = userPos
    ? crimeForDistrict(crimeIndex, findDistrict(userPos[0], userPos[1]))
    : null

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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={(lat, lng) => setRatingPoint([lat, lng])} />
        <SearchBar center={center} onSelect={(lat, lng) => setDestination([lat, lng])} />
        <HeatmapLayer ratings={ratings} />
        {userPos && <Marker position={userPos} icon={userIcon} />}
        {destination && <Marker position={destination} icon={destinationIcon} />}
        {ratingPoint && <Marker position={ratingPoint} icon={destinationIcon} />}
        <RoutePolylines routes={routes} />
      </MapContainer>

      <AreaSafetyCard crime={areaCrime} />
      {!destination && !ratingPoint && <SOSButton />}

      {ratingPoint && (
        <RatingPanel
          lat={ratingPoint[0]}
          lng={ratingPoint[1]}
          onClose={() => setRatingPoint(null)}
          onSaved={() => {
            setRatingPoint(null)
            loadRatings()
          }}
        />
      )}

      {!ratingPoint && (
        <RouteSheet routes={routes} loading={routesLoading} onClear={() => setDestination(null)} />
      )}
    </div>
  )
}
