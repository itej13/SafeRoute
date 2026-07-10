import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/map',
    label: 'Map',
    icon: (
      <path d="M9 2 3 4.5v15L9 17l6 2.5 6-2.5v-15L15 4.5 9 2zm0 2.3 6 2.5v12.9l-6-2.5V4.3z" />
    ),
  },
  {
    to: '/sos',
    label: 'SOS',
    icon: (
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5z" />
    ),
  },
]

export default function Navbar() {
  return (
    <nav className="flex justify-around border-t border-night-600 bg-night-800 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-6 py-2.5 text-xs font-medium transition-colors ${
              isActive ? 'text-lamp-400' : 'text-mist-400 hover:text-mist-100'
            }`
          }
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
            {tab.icon}
          </svg>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
