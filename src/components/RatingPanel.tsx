import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Props {
  lat: number | null
  lng: number | null
  onClose: () => void
  onSubmitted: () => void
}

function ScoreLabel(score: number) {
  if (score <= 1) return '😰 Very Unsafe'
  if (score <= 2) return '😟 Unsafe'
  if (score <= 3) return '😐 Moderate'
  if (score <= 4) return '🙂 Safe'
  return '😊 Very Safe'
}

export default function RatingPanel({ lat, lng, onClose, onSubmitted }: Props) {
  const { user } = useAuth()
  const [safety, setSafety] = useState(3)
  const [lighting, setLighting] = useState(3)
  const [crowd, setCrowd] = useState(3)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = lat !== null && lng !== null

  const handleSubmit = async () => {
    if (!user || lat === null || lng === null) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('ratings').insert({
      user_id: user.id,
      lat,
      lng,
      safety_score: safety,
      lighting,
      crowd,
      comment: comment.trim() || null,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      onSubmitted()
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[900]"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[950] bg-white rounded-t-3xl shadow-2xl bottom-sheet ${
          isOpen ? 'bottom-sheet-visible' : 'bottom-sheet-hidden'
        }`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="max-w-[480px] mx-auto px-5 py-6 pb-24">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-secondary">Rate this location</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {lat !== null && lng !== null && (
            <p className="text-xs text-gray-400 mb-5 font-mono">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          )}

          {/* Safety Score */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-secondary">Safety</label>
              <span className="text-sm text-gray-500">{ScoreLabel(safety)}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={safety}
              onChange={e => setSafety(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #E63946 0%, #f4a261 25%, #e9c46a 50%, #2A9D8F 75%, #2A9D8F 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>

          {/* Lighting */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-secondary">Lighting</label>
              <span className="text-sm text-gray-500">{safety <= 2 ? '🌑 Dark' : safety <= 3 ? '🌤 Moderate' : '☀️ Well-lit'}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={lighting}
              onChange={e => setLighting(Number(e.target.value))}
              className="w-full"
              style={{ background: `linear-gradient(to right, #1D3557 0%, #457B9D ${((lighting - 1) / 4) * 100}%, #e5e7eb ${((lighting - 1) / 4) * 100}%)` }}
            />
          </div>

          {/* Crowd */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-secondary">Crowd Density</label>
              <span className="text-sm text-gray-500">{crowd <= 2 ? '👤 Empty' : crowd <= 3 ? '👥 Moderate' : '👥👥 Crowded'}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={crowd}
              onChange={e => setCrowd(Number(e.target.value))}
              className="w-full"
              style={{ background: `linear-gradient(to right, #457B9D 0%, #1D3557 ${((crowd - 1) / 4) * 100}%, #e5e7eb ${((crowd - 1) / 4) * 100}%)` }}
            />
          </div>

          {/* Comment */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-secondary block mb-2">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe what you noticed here..."
              rows={2}
              maxLength={200}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-secondary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-primary mb-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-secondary text-white font-semibold rounded-2xl text-sm disabled:opacity-60 active:scale-95 transition-transform"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </>
  )
}
