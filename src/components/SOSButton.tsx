import { useNavigate } from 'react-router-dom'

export default function SOSButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/sos')}
      className="fixed bottom-24 right-4 z-[1000] w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center sos-pulse focus:outline-none"
      aria-label="SOS Emergency"
    >
      <span className="text-sm font-bold tracking-wider">SOS</span>
    </button>
  )
}
