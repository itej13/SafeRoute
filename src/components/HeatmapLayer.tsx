import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { RatingPoint } from '../lib/types'

// Weight: low safety score = hot spot. Score 1 → 1.0, score 5 → 0.2.
const toPoint = (r: RatingPoint): [number, number, number] => [r.lat, r.lng, (6 - r.score) / 5]

export default function HeatmapLayer({ ratings }: { ratings: RatingPoint[] }) {
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
    layerRef.current = layer

    // leaflet.heat throws (getImageData on width 0) if added before the map
    // container has a measured size — retry until layout has happened
    let timer: number | undefined
    const tryAdd = () => {
      if (map.getSize().x > 0) {
        layer.addTo(map)
      } else {
        map.invalidateSize()
        timer = window.setTimeout(tryAdd, 100)
      }
    }
    tryAdd()

    return () => {
      if (timer) clearTimeout(timer)
      layer.remove() // safe no-op when the layer was never added
      layerRef.current = null
    }
  }, [map])

  useEffect(() => {
    layerRef.current?.setLatLngs(ratings.map(toPoint))
  }, [ratings])

  return null
}
