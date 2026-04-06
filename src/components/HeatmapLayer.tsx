import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import { supabase } from '../lib/supabase'
import type { HeatLatLngTuple } from 'leaflet.heat'

interface Props {
  refreshKey: number
}

export default function HeatmapLayer({ refreshKey }: Props) {
  const map = useMap()
  const heatRef = useRef<ReturnType<typeof import('leaflet.heat')['heatLayer']> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('ratings')
        .select('lat, lng, safety_score')

      if (cancelled || error || !data) return

      const points: HeatLatLngTuple[] = data.map(r => [
        r.lat,
        r.lng,
        // Invert score: low safety = high heat intensity (red), high safety = low (green)
        (6 - r.safety_score) / 5,
      ])

      const { heatLayer } = await import('leaflet.heat')

      if (heatRef.current) {
        map.removeLayer(heatRef.current as unknown as L.Layer)
      }

      heatRef.current = heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: '#2A9D8F',  // safe — green
          0.4: '#e9c46a',  // moderate — yellow
          0.7: '#f4a261',  // warning — orange
          1.0: '#E63946',  // danger — red
        },
      })

      heatRef.current.addTo(map)
    }

    load()

    return () => {
      cancelled = true
      if (heatRef.current) {
        map.removeLayer(heatRef.current as unknown as L.Layer)
        heatRef.current = null
      }
    }
  }, [map, refreshKey])

  return null
}
