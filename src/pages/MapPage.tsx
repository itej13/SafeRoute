import { useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import HeatmapLayer from '../components/HeatmapLayer'
import RatingPanel from '../components/RatingPanel'
import SOSButton from '../components/SOSButton'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DTU_CENTER: [number, number] = [28.7501, 77.1177]

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyToControl() {
  const map = useMap()

  const flyToLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: 1.5 }),
      err => console.error('Geolocation error:', err)
    )
  }

  return (
    <button
      onClick={flyToLocation}
      className="absolute bottom-24 left-4 z-[1000] w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
      aria-label="My location"
    >
      <svg viewBox="0 0 24 24" fill="#1D3557" className="w-5 h-5">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
      </svg>
    </button>
  )
}

function SearchBar() {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data[0]) {
        map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 16, { duration: 1.5 })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="absolute top-4 left-4 right-4 z-[1000] flex gap-2"
    >
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search a place..."
        className="flex-1 bg-white rounded-2xl px-4 py-3 text-sm text-secondary shadow-lg outline-none placeholder-gray-400 border border-gray-100 focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-secondary text-white px-4 rounded-2xl shadow-lg text-sm font-medium disabled:opacity-60 active:scale-95 transition-transform"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        )}
      </button>
    </form>
  )
}

export default function MapPage() {
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedPoint({ lat, lng })
  }, [])

  const handleSubmitted = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

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
        <SearchBar />
        <FlyToControl />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-20 right-16 z-[999] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md text-xs">
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

      <SOSButton />

      <RatingPanel
        lat={selectedPoint?.lat ?? null}
        lng={selectedPoint?.lng ?? null}
        onClose={() => setSelectedPoint(null)}
        onSubmitted={handleSubmitted}
      />
    </div>
  )
}
