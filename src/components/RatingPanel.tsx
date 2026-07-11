import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Utilities } from '../lib/types'

interface RatingPanelProps {
  lat: number
  lng: number
  onClose: () => void
  onSaved: () => void
}

// SafetiPin audit parameters, phrased as one-tap observations
const utilityOptions: { key: keyof Utilities; label: string }[] = [
  { key: 'lighting', label: 'Well lit' },
  { key: 'open', label: 'Open & visible' },
  { key: 'people', label: 'People around' },
  { key: 'women', label: 'Women around' },
  { key: 'security', label: 'Police/guards' },
  { key: 'walkpath', label: 'Good footpath' },
  { key: 'transport', label: 'Transport nearby' },
]

const scoreLabels = ['', 'Unsafe', 'Risky', 'Okay', 'Good', 'Very safe']

export default function RatingPanel({ lat, lng, onClose, onSaved }: RatingPanelProps) {
  const { user } = useAuth()
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [utilities, setUtilities] = useState<Utilities>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!user || score < 1) return
    setSaving(true)
    setError(null)
    const { error: dbError } = await supabase.from('ratings').insert({
      user_id: user.id,
      lat,
      lng,
      score,
      comment: comment.trim().slice(0, 500) || null,
      utilities,
    })
    setSaving(false)
    if (dbError) {
      setError('Could not save your rating. Check your connection and try again.')
      return
    }
    onSaved()
  }

  return (
    <div
      data-no-map-click
      className="absolute inset-x-0 bottom-0 z-[1000] rounded-t-2xl border-t border-night-600 bg-night-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg">How safe is this spot?</h2>
        <button onClick={onClose} aria-label="Close" className="p-1 text-mist-400 hover:text-mist-100">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" />
          </svg>
        </button>
      </div>

      <div className="mb-1 flex gap-2" role="radiogroup" aria-label="Safety score">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            role="radio"
            aria-checked={score === n}
            aria-label={`${n}: ${scoreLabels[n]}`}
            onClick={() => setScore(n)}
            className={`h-11 flex-1 rounded-lg text-sm font-semibold transition-colors ${
              score >= n ? 'bg-lamp-400 text-night-900' : 'bg-night-700 text-mist-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mb-3 h-4 text-center text-xs text-mist-400">{scoreLabels[score]}</p>

      <div className="mb-3 flex flex-wrap gap-2">
        {utilityOptions.map(({ key, label }) => (
          <button
            key={key}
            aria-pressed={!!utilities[key]}
            onClick={() => setUtilities(u => ({ ...u, [key]: !u[key] }))}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              utilities[key] ? 'bg-safe/20 text-safe' : 'bg-night-700 text-mist-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Anything others should know? (optional)"
        className="mb-3 w-full resize-none rounded-lg border border-night-600 bg-night-700 p-2.5 text-sm placeholder:text-mist-400 focus:border-lamp-400 focus:outline-none"
      />

      {error && <p className="mb-2 text-sm text-risk">{error}</p>}

      <button
        onClick={save}
        disabled={score < 1 || saving}
        className="w-full rounded-lg bg-lamp-400 py-3 font-semibold text-night-900 transition-opacity disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save rating'}
      </button>
    </div>
  )
}
