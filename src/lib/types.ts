export interface Rating {
  id: string
  user_id: string
  lat: number
  lng: number
  safety_score: number
  lighting: number
  crowd: number
  comment: string | null
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
