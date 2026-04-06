import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}
