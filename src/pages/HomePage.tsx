import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const steps = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
      </svg>
    ),
    title: 'Rate Routes',
    desc: 'Tap any location on the map to submit safety ratings for lighting, crowd density, and overall feel.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
    title: 'See Safety Zones',
    desc: 'Live heatmap shows crowd-sourced danger areas in red and safe zones in green, updated in real-time.',
    color: 'bg-safe/10 text-safe',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
    title: 'SOS When Needed',
    desc: 'One tap sends your GPS location via WhatsApp to emergency contacts and dials 112 instantly.',
    color: 'bg-primary/10 text-primary',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const handleCTA = () => {
    navigate(session ? '/map' : '/auth')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="bg-secondary text-white px-6 pt-16 pb-14 flex flex-col items-center text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full translate-y-24 -translate-x-24" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl mb-6 mx-auto">
            <svg viewBox="0 0 24 24" fill="white" className="w-11 h-11">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>

          <h1 className="text-5xl font-extrabold mb-3 tracking-tight">SafeRoute</h1>
          <p className="text-blue-200 text-lg font-medium mb-2">Walk safe. Walk confident.</p>
          <p className="text-blue-100/70 text-sm max-w-xs leading-relaxed mb-8">
            Crowd-sourced women's safety heatmap for your city. Know before you go.
          </p>

          <button
            onClick={handleCTA}
            className="bg-primary text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
          >
            Open Map →
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-[480px] mx-auto flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-secondary">1K+</p>
            <p className="text-xs text-gray-500">Ratings</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-safe">200+</p>
            <p className="text-xs text-gray-500">Safe zones</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-primary">24/7</p>
            <p className="text-xs text-gray-500">Live data</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-8 max-w-[480px] mx-auto w-full">
        <h2 className="text-xl font-bold text-secondary mb-5">How it works</h2>
        <div className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <h3 className="font-semibold text-secondary text-sm mb-1">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto px-6 pb-10 max-w-[480px] mx-auto w-full">
        <button
          onClick={handleCTA}
          className="w-full py-4 bg-secondary text-white font-semibold rounded-2xl text-sm active:scale-95 transition-transform"
        >
          Get Started — It's Free
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Built for Vihaan 9.0 · DTU Delhi
        </p>
      </div>
    </div>
  )
}
