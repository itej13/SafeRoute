import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { HeatCell } from '../lib/types'

// Weight: low average score = hot spot, scaled up (capped) by report density.
// Score 1 → 1.0, score 5 → 0.2; 5+ reports in a cell doubles its presence.
const toPoint = (c: HeatCell): [number, number, number] => [
  c.lat,
  c.lng,
  ((6 - c.avg_score) / 5) * (1 + Math.min(c.cnt, 5) / 5),
]

export default function HeatmapLayer({ cells }: { cells: HeatCell[] }) {
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
    layerRef.current?.setLatLngs(cells.map(toPoint))
  }, [cells])

  return null
}
