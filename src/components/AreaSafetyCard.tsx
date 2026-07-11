import type { DistrictCrime } from '../lib/crimeData'

// Renders nothing when crime data is unavailable (no key / fetch failed / outside Delhi)
export default function AreaSafetyCard({ crime }: { crime: DistrictCrime | null }) {
  if (!crime) return null

  const tone = crime.safetyIndex >= 60 ? 'text-safe' : crime.safetyIndex >= 30 ? 'text-lamp-400' : 'text-risk'

  return (
    <div
      data-no-map-click
      className="rounded-xl border border-night-600 bg-night-800/95 px-3.5 py-2.5 shadow-lg"
    >
      <p className="text-[11px] uppercase tracking-wide text-mist-400">You're in {crime.district}</p>
      <p className="text-sm font-semibold">
        Area safety <span className={tone}>{crime.safetyIndex}/100</span>
      </p>
      <p className="text-[10px] text-mist-400">Official NCRB statistics ({crime.year}), not real-time</p>
    </div>
  )
}
