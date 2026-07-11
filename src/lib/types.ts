// SafetiPin safety-audit parameters (Lighting, Openness+Visibility, Crowd,
// Gender Diversity, Security, Walkpath, Public Transport); "Feeling" is the 1–5 score
export interface Utilities {
  lighting?: boolean
  open?: boolean
  people?: boolean
  women?: boolean
  security?: boolean
  walkpath?: boolean
  transport?: boolean
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

/** The slice of a rating the map and route scoring actually read — keeps queries light. */
export type RatingPoint = Pick<Rating, 'id' | 'lat' | 'lng' | 'score' | 'utilities'>

/** One ~150 m grid cell from the heatmap_cells RPC. */
export interface HeatCell {
  lat: number
  lng: number
  avg_score: number
  cnt: number
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
  safetyScore: number | null // 1–5 journey rating, null when no signal available
  reportCount: number // crowd ratings near this route
  weakFactor: string | null // most-reported missing safety factor, e.g. "poor lighting"
}
