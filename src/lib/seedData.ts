import { supabase } from './supabase'

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const comments = [
  'Well-lit street, felt safe',
  'Dark alley, avoid at night',
  'Busy market area, crowded',
  'Quiet residential zone',
  'Poor lighting near the park',
  'Good pedestrian footpath',
  'Felt uncomfortable here',
  'Auto stands nearby, helpful',
  'Construction zone, uneven road',
  'Nice and open, felt secure',
  null,
  null,
  null,
]

export async function seedRatings(userId: string): Promise<{ inserted: number; error: string | null }> {
  const rows = Array.from({ length: 80 }, () => ({
    user_id: userId,
    lat: randomBetween(28.745, 28.755),
    lng: randomBetween(77.112, 77.122),
    safety_score: randomInt(1, 5),
    lighting: randomInt(1, 5),
    crowd: randomInt(1, 5),
    comment: comments[randomInt(0, comments.length - 1)],
  }))

  const { error } = await supabase.from('ratings').insert(rows)

  if (error) return { inserted: 0, error: error.message }
  return { inserted: rows.length, error: null }
}
