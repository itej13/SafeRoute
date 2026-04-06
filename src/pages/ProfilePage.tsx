import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { EmergencyContact } from '../lib/types'
import { seedRatings } from '../lib/seedData'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [ratingsCount, setRatingsCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [toast, setToast] = useState('')

  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (!user) return
    // Load profile
    supabase
      .from('profiles')
      .select('full_name, emergency_contacts')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '')
          setContacts(data.emergency_contacts ?? [])
        }
      })
    // Count ratings
    supabase
      .from('ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setRatingsCount(count ?? 0))
  }, [user])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName, emergency_contacts: contacts })
    setSaving(false)
    if (!error) showToast('Profile saved!')
    else showToast('Error: ' + error.message)
  }

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) return
    setContacts(prev => [...prev, { name: newName.trim(), phone: newPhone.trim() }])
    setNewName('')
    setNewPhone('')
  }

  const removeContact = (i: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSeed = async () => {
    if (!user) return
    setSeedMsg('Seeding...')
    const { inserted, error } = await seedRatings(user.id)
    setSeedMsg(error ? `Error: ${error}` : `✓ Inserted ${inserted} ratings`)
    setRatingsCount(c => c + inserted)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[480px] mx-auto px-5 pt-8">
        {/* Header */}
        <h1 className="text-2xl font-extrabold text-secondary mb-6">Profile</h1>

        {/* Avatar + info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {(fullName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary truncate">{fullName || 'Set your name'}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            <div className="mt-2 flex gap-3">
              <span className="text-xs bg-safe/10 text-safe font-medium px-2 py-0.5 rounded-full">
                {ratingsCount} ratings
              </span>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">Display Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-secondary outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-4">
            Emergency Contacts
          </label>

          {contacts.length === 0 && (
            <p className="text-gray-400 text-sm mb-4">No contacts yet. Add someone who'll be alerted during SOS.</p>
          )}

          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary truncate">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
              </div>
              <button
                onClick={() => removeContact(i)}
                className="text-gray-400 hover:text-primary p-1"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add new contact */}
          <div className="flex flex-col gap-2 mt-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Contact name"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="tel"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="Phone number (e.g. +919876543210)"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={addContact}
              className="py-2.5 bg-accent/10 text-accent font-semibold rounded-xl text-sm active:scale-95 transition-transform"
            >
              + Add Contact
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full py-4 bg-secondary text-white font-semibold rounded-2xl text-sm mb-4 disabled:opacity-60 active:scale-95 transition-transform"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Dev Seed */}
        {isDev && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-yellow-700 mb-2">⚙️ Dev Tools</p>
            <button
              onClick={handleSeed}
              className="w-full py-2.5 bg-yellow-400 text-yellow-900 font-semibold rounded-xl text-sm active:scale-95 transition-transform"
            >
              Seed 80 Sample Ratings around DTU
            </button>
            {seedMsg && <p className="text-xs text-yellow-700 mt-2">{seedMsg}</p>}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 border-2 border-primary text-primary font-semibold rounded-2xl text-sm active:scale-95 transition-transform"
        >
          Sign Out
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-secondary text-white px-5 py-3 rounded-2xl text-sm shadow-xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
