import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** False while .env still holds the placeholder values. */
export const isSupabaseConfigured =
  !!url && !!anonKey && !url.includes('your-project-id') && !anonKey.startsWith('your-')

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder'
)
