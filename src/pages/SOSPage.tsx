import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { EmergencyContact } from '../lib/types'

type SosState = 'idle' | 'locating' | 'ready' | 'error'

export default function SOSPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [state, setState] = useState<SosState>('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at')
      .then(({ data }) => setContacts(data ?? []))
  }, [user])

  const activate = () => {
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      async p => {
        const mapsLink = `https://www.openstreetmap.org/?mlat=${p.coords.latitude}&mlon=${p.coords.longitude}#map=17/${p.coords.latitude}/${p.coords.longitude}`
        const message = `EMERGENCY — I need help. My live location: ${mapsLink}`
        setShareUrl(`https://wa.me/?text=${encodeURIComponent(message)}`)
        setState('ready')
        if (navigator.share) {
          try {
            await navigator.share({ title: 'SafeRoute SOS', text: message })
          } catch {
            // user closed the share sheet — WhatsApp fallback stays visible
          }
        }
      },
      () => setState('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl">Emergency</h1>
      <p className="mt-2 max-w-sm text-sm text-mist-400">
        One tap shares your exact location with the people you trust.
      </p>

      <button
        onClick={activate}
        disabled={state === 'locating'}
        className="mt-10 flex h-44 w-44 items-center justify-center rounded-full bg-risk font-display text-4xl font-semibold text-white shadow-2xl shadow-risk/30 transition-transform active:scale-95 disabled:opacity-60"
      >
        {state === 'locating' ? '…' : 'SOS'}
      </button>

      <div className="mt-8 min-h-16 max-w-sm">
        {state === 'error' && (
          <p className="text-sm text-risk">
            Couldn't get your location. Check location permissions and try again.
          </p>
        )}
        {state === 'ready' && shareUrl && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl bg-safe px-6 py-3 font-semibold text-night-900"
          >
            Send on WhatsApp
          </a>
        )}
        {contacts.length === 0 && state === 'idle' && (
          <p className="text-sm text-mist-400">
            Tip: add emergency contacts in{' '}
            <Link to="/profile" className="text-lamp-400 underline">
              your profile
            </Link>{' '}
            so they're one tap away.
          </p>
        )}
      </div>

      <a href="tel:112" className="mt-4 text-sm text-mist-400 underline">
        Or call 112 — national emergency number
      </a>
    </div>
  )
}
