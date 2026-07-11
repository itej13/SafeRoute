// Official NCRB district-wise crimes-against-women statistics for Delhi (2015 —
// the latest district-level year NCRB published via data.gov.in). The dataset is
// annual and immutable, so it ships bundled: no API key, no runtime fetch.
// Source: data.gov.in resource 5ec42b22-a627-4b90-b8b3-ffece84d44f4.

import crimeRows from '../data/delhi-crime-ncrb.json'
import districts from '../data/delhi-districts.json'

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

// Keep only rows that correspond to a mapped district boundary — the raw data also
// contains police units (Crime Branch, SPUWAC, "Total District(s)"…) that would
// otherwise distort the intensity scale.
const knownDistricts = new Set(districts.map(d => normalize(d.name)))

const rows = crimeRows
  .map(r => ({ ...r, district: normalize(r.district) }))
  .filter(r => knownDistricts.has(r.district))

const max = Math.max(...rows.map(r => r.totalCrimes), 1)

export const delhiCrimeIndex: Map<string, DistrictCrime> = new Map(
  rows.map(r => [
    r.district,
    { ...r, safetyIndex: Math.round((1 - r.totalCrimes / max) * 100) },
  ])
)

/** Stats for a census-district name (as returned by findDistrict), or null. */
export function crimeForDistrict(districtName: string | null): DistrictCrime | null {
  if (!districtName) return null
  return delhiCrimeIndex.get(normalize(districtName)) ?? null
}
