export interface Utilities {
  lighting?: boolean
  crowded?: boolean
  cctv?: boolean
}

export interface Rating {
  id: string
  user_id: string
  lat: number
  lng: number
  score: number
  comment: string | null
  utilities: Utilities
  created_at: string
}

export interface EmergencyContact {
  id: string
  user_id: string
  name: string
  phone: string
  created_at: string
}

/** Photon (komoot) geocoding result feature. */
export interface PhotonFeature {
  geometry: { coordinates: [number, number] } // [lng, lat]
  properties: {
    name?: string
    street?: string
    city?: string
    osm_id: number
  }
}

export interface RouteData {
  coords: [number, number][] // [lat, lng]
  distanceMeters: number
  durationSeconds: number
  safetyScore: number | null // 1–5, null when no signal available
}
