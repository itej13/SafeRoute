import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'

// The Leaflet-heavy app pages load on demand — visitors who only see the
// landing page never download the map stack.
const MapPage = lazy(() => import('./pages/MapPage'))
const SOSPage = lazy(() => import('./pages/SOSPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-mist-400">Loading…</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/map" element={<MapPage />} />
              <Route path="/sos" element={<SOSPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
