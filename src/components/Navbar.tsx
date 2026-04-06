import { NavLink, useLocation } from 'react-router-dom'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
  </svg>
)

const SOSIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
)

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

export default function Navbar() {
  const location = useLocation()
  const hide = ['/', '/auth'].includes(location.pathname)
  if (hide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom shadow-lg">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              isActive ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          <HomeIcon />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              isActive ? 'text-accent' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          <MapIcon />
          <span className="text-[10px] font-medium">Map</span>
        </NavLink>

        <NavLink
          to="/sos"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              isActive ? 'text-primary' : 'text-primary/70 hover:text-primary'
            }`
          }
        >
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md -mt-6 border-4 border-white">
            <SOSIcon />
          </div>
          <span className="text-[10px] font-medium text-primary">SOS</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              isActive ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          <ProfileIcon />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  )
}
