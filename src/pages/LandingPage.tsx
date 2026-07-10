import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const features = [
  {
    title: 'Rated by women who walk here',
    body: 'Every point on the map can carry a safety rating from someone who has actually been there — lighting, crowds, CCTV, and what it feels like after dark.',
  },
  {
    title: 'See the city in light and shadow',
    body: 'Ratings build a live heatmap of safe corridors and stretches to avoid, layered with official NCRB crime statistics for your Delhi district.',
  },
  {
    title: 'The safest way, not just the fastest',
    body: 'Pick a destination and compare routes side by side — each one scored by the community and official data, so the trade-off is yours to see.',
  },
  {
    title: 'One tap when it matters',
    body: 'SOS shares your live location with your emergency contacts through WhatsApp or your phone’s share sheet. No menus, no typing.',
  },
]

export default function LandingPage() {
  const { session } = useAuth()
  const ctaTarget = session ? '/map' : '/auth'

  return (
    <div className="min-h-full overflow-y-auto">
      {/* Hero — a route drawing itself between streetlamps */}
      <header className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <svg
          viewBox="0 0 360 200"
          className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 opacity-90"
          aria-hidden
        >
          <path
            className="hero-route"
            d="M-10 170 C60 150 70 90 140 85 S250 110 300 60 S360 30 380 20"
            fill="none"
            stroke="#FFB648"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[
            [70, 128],
            [180, 92],
            [300, 60],
          ].map(([x, y], i) => (
            <g key={i} className="hero-lamp" style={{ animationDelay: `${1 + i * 0.9}s` }}>
              <circle cx={x} cy={y} r="16" fill="#FFB648" opacity="0.12" />
              <circle cx={x} cy={y} r="3.5" fill="#FFB648" />
            </g>
          ))}
        </svg>

        <div className="relative">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-lamp-400">
            SafeRoute · Delhi
          </p>
          <h1 className="mx-auto max-w-xl font-display text-4xl leading-tight sm:text-5xl">
            Walk the lit path.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-mist-400">
            A safety map of Delhi built by the women who move through it — rate streets, see the
            heatmap, and choose routes with your eyes open.
          </p>
          <Link
            to={ctaTarget}
            className="mt-8 inline-block rounded-xl bg-lamp-400 px-8 py-3.5 font-semibold text-night-900 shadow-lg shadow-lamp-400/20 transition-transform active:scale-95"
          >
            Open the map
          </Link>
        </div>
      </header>

      {/* Features — quiet rows, the hero already spoke */}
      <main className="mx-auto max-w-xl px-6 pb-16">
        <ul className="space-y-10">
          {features.map(f => (
            <li key={f.title} className="border-l-2 border-lamp-400/40 pl-5">
              <h2 className="font-display text-xl">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{f.body}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="border-t border-night-700 px-6 py-8 text-center text-xs text-mist-400">
        <p>
          Maps © OpenStreetMap contributors · Routing by OSRM · Crime statistics from NCRB via
          data.gov.in
        </p>
        <p className="mt-2">Your location is only shared when you choose to share it.</p>
      </footer>
    </div>
  )
}
