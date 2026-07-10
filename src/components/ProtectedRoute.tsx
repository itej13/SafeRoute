import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Navbar from './Navbar'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-mist-400">Loading…</p>
      </div>
    )
  }
  if (!session) return <Navigate to="/auth" replace />

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <Navbar />
    </div>
  )
}
