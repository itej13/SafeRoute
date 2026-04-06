export interface UtilityRating {
  washroom: boolean | null
  medical_store: boolean | null
  pad_dispenser: boolean | null
  police_booth: boolean | null
}

export interface Rating {
  id: string
  user_id: string
  lat: number
  lng: number
  safety_score: number
  lighting: number
  crowd: number
  comment: string | null
  utilities: UtilityRating | null
  created_at: string
}

export interface EmergencyContact {
  name: string
  phone: string
}

export interface Profile {
  id: string
  full_name: string | null
  emergency_contacts: EmergencyContact[]
  created_at: string
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface RouteData {
  index: number
  distance: number   // metres
  duration: number   // seconds
  coordinates: [number, number][]  // [lng, lat] GeoJSON order
  safetyScore: number              // 1–5
  color: string
}
