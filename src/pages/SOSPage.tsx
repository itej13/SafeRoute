import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { EmergencyContact } from '../lib/types'

export default function SOSPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [sent, setSent] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('emergency_contacts')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.emergency_contacts) setContacts(data.emergency_contacts)
      })
  }, [user])

  const sendSOS = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`
        const message = encodeURIComponent(
          `🚨 EMERGENCY! I need help. My location: ${mapsLink}`
        )
        window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
        setSent(true)
      },
      () => {
        // Fallback without coords
        const message = encodeURIComponent('🚨 EMERGENCY! I need help. Please call me immediately.')
        window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
        setSent(true)
      }
    )
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-between px-6 py-10 pb-24">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1 text-white/70 hover:text-white mb-8 text-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>

        {/* Header */}
        <h1 className="text-white text-3xl font-extrabold mb-1">Emergency SOS</h1>
        <p className="text-red-200 text-sm mb-10 text-center">
          Tap the button to instantly share your location
        </p>

        {/* SOS Big Button */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Ring animations */}
          <div className="absolute w-52 h-52 rounded-full border-4 border-white/20 ring-pulse" />
          <div className="absolute w-44 h-44 rounded-full border-4 border-white/30 ring-pulse" style={{ animationDelay: '0.6s' }} />

          <button
            onClick={sendSOS}
            disabled={sent}
            className="relative w-36 h-36 rounded-full bg-white text-primary font-extrabold text-2xl shadow-2xl active:scale-95 transition-transform disabled:opacity-80 flex flex-col items-center justify-center gap-1 z-10"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{sent ? 'SENT ✓' : 'SOS'}</span>
          </button>
        </div>

        {sent && coords && (
          <div className="bg-white/10 rounded-2xl px-4 py-3 mb-6 text-center w-full">
            <p className="text-white text-sm font-medium">📍 Location shared</p>
            <p className="text-red-200 text-xs mt-1 font-mono">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          </div>
        )}

        {/* Call 112 */}
        <a
          href="tel:112"
          className="w-full py-4 bg-white text-primary font-bold text-lg rounded-2xl text-center shadow-xl active:scale-95 transition-transform mb-6 block"
        >
          📞 Call 112 (Emergency)
        </a>

        {/* Helplines */}
        <div className="w-full bg-white/10 rounded-2xl p-4 mb-6">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">National Helplines</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Women Helpline', number: '1091' },
              { label: 'Police', number: '100' },
              { label: 'Ambulance', number: '102' },
            ].map(h => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="flex justify-between items-center bg-white/10 rounded-xl px-4 py-2.5 active:bg-white/20 transition-colors"
              >
                <span className="text-white text-sm">{h.label}</span>
                <span className="text-white font-bold text-lg">{h.number}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        {contacts.length > 0 && (
          <div className="w-full">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">My Emergency Contacts</p>
            <div className="flex flex-col gap-2">
              {contacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phone}`}
                  className="flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 active:bg-white/20 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    <p className="text-red-200 text-xs">{c.phone}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 opacity-70">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {contacts.length === 0 && (
          <button
            onClick={() => navigate('/profile')}
            className="text-white/60 text-xs underline mt-2"
          >
            + Add emergency contacts in Profile
          </button>
        )}
      </div>
    </div>
  )
}
