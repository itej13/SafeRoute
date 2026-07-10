// Official NCRB district-wise crimes-against-women statistics for Delhi,
// served by the data.gov.in open-data API. Annual data — the app labels it
// as official statistics, never as real-time.

const API_KEY = import.meta.env.VITE_DATA_GOV_IN_KEY as string | undefined
const RESOURCE_ID = '5ec42b22-a627-4b90-b8b3-ffece84d44f4' // District/Area-wise crimes against women, NCRB
const CACHE_KEY = 'saferoute:crime-index:v1'

export interface DistrictCrime {
  district: string
  totalCrimes: number
  /** 0 (highest-crime district in Delhi) to 100 (lowest). Relative, not absolute. */
  safetyIndex: number
  year: number
}

// NCRB rows use police-district names; boundary data uses census names.
// Normalizing hyphens/case aligns the two ("North-East" → "north east").
const normalize = (name: string) => name.toLowerCase().replace(/[-_]/g, ' ').trim()

function isConfigured(): boolean {
  return !!API_KEY && !API_KEY.startsWith('your-')
}

interface NcrbRecord {
  district_area?: string
  year?: string
  [column: string]: string | undefined
}

// Sum every numeric crime column in a record (rape, dowry deaths, cruelty, …)
function totalOf(record: NcrbRecord): number {
  let total = 0
  for (const [key, value] of Object.entries(record)) {
    if (key === 'document_id' || key === 'year' || key === 'sl_no_') continue
    const n = Number(value)
    if (Number.isFinite(n)) total += n
  }
  return total
}

let inFlight: Promise<Map<string, DistrictCrime> | null> | null = null

/**
 * District name (normalized) → crime stats for Delhi. Cached in sessionStorage.
 * Resolves null when the key is unset or the fetch fails — callers hide the
 * Area Safety feature in that case; nothing else depends on this.
 */
export function fetchDelhiCrimeIndex(): Promise<Map<string, DistrictCrime> | null> {
  if (!isConfigured()) return Promise.resolve(null)
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) return new Map(JSON.parse(cached) as [string, DistrictCrime][])

      const url =
        `https://api.data.gov.in/resource/${RESOURCE_ID}` +
        `?api-key=${API_KEY}&format=json&limit=50` +
        `&filters%5Bstate_ut%5D=${encodeURIComponent('Delhi UT')}`
      const res = await fetch(url)
      if (!res.ok) return null
      const data: { records?: NcrbRecord[] } = await res.json()
      if (!data.records?.length) return null

      const rows = data.records
        .map(r => ({
          district: normalize(r.district_area ?? ''),
          totalCrimes: totalOf(r),
          year: Number(r.year) || 0,
        }))
        .filter(r => r.district)
      const max = Math.max(...rows.map(r => r.totalCrimes), 1)

      const map = new Map<string, DistrictCrime>()
      for (const row of rows) {
        map.set(row.district, {
          ...row,
          safetyIndex: Math.round((1 - row.totalCrimes / max) * 100),
        })
      }
      sessionStorage.setItem(CACHE_KEY, JSON.stringify([...map]))
      return map
    } catch {
      return null // fail-soft: Area Safety simply doesn't render
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/** Stats for the district containing a normalized census-district name. */
export function crimeForDistrict(
  index: Map<string, DistrictCrime> | null,
  districtName: string | null
): DistrictCrime | null {
  if (!index || !districtName) return null
  return index.get(normalize(districtName)) ?? null
}
