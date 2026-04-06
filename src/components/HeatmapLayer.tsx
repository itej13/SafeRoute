import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'

type HeatLayerInstance = L.Layer & {
  setLatLngs: (pts: [number, number, number][]) => void
  redraw: () => void
}

interface Props {
  refreshKey: number
}

export default function HeatmapLayer({ refreshKey }: Props) {
  const map = useMap()
  const heatRef = useRef<HeatLayerInstance | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Load leaflet.heat once — it attaches L.heatLayer as a side-effect
      if (!loadedRef.current) {
        await import('leaflet.heat')
        loadedRef.current = true
      }

      const { data, error } = await supabase
        .from('ratings')
        .select('lat, lng, safety_score')

      if (cancelled || error || !data) return

      const points: [number, number, number][] = data.map(r => [
        r.lat,
        r.lng,
        (6 - r.safety_score) / 5, // invert: low safety = high intensity (red)
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lHeat = (L as any).heatLayer

      if (heatRef.current) {
        map.removeLayer(heatRef.current)
      }

      heatRef.current = lHeat(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: '#2A9D8F',
          0.4: '#e9c46a',
          0.7: '#f4a261',
          1.0: '#E63946',
        },
      }).addTo(map)
    }

    load()

    return () => {
      cancelled = true
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
    }
  }, [map, refreshKey])

  return null
}
