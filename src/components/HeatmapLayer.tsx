import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { Rating } from '../lib/types'

// Weight: low safety score = hot spot. Score 1 → 1.0, score 5 → 0.2.
const toPoint = (r: Rating): [number, number, number] => [r.lat, r.lng, (6 - r.score) / 5]

export default function HeatmapLayer({ ratings }: { ratings: Rating[] }) {
  const map = useMap()
  const layerRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    // leaflet.heat can't update options in place; create once, update points via setLatLngs
    const layer = L.heatLayer([], {
      radius: 28,
      blur: 20,
      maxZoom: 17,
      gradient: { 0.2: '#3EC98E', 0.5: '#FFB648', 0.8: '#E4576B' },
    })
    layer.addTo(map)
    layerRef.current = layer
    return () => {
      layer.remove()
      layerRef.current = null
    }
  }, [map])

  useEffect(() => {
    layerRef.current?.setLatLngs(ratings.map(toPoint))
  }, [ratings])

  return null
}
