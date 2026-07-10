import { useNavigate } from 'react-router-dom'

export default function SOSButton() {
  const navigate = useNavigate()
  return (
    <button
      data-no-map-click
      onClick={() => navigate('/sos')}
      aria-label="Open SOS"
      className="absolute bottom-6 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-risk font-display text-base font-semibold text-white shadow-xl transition-transform active:scale-95"
    >
      SOS
    </button>
  )
}
