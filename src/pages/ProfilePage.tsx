import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { EmergencyContact } from '../lib/types'

// Mirrors the DB CHECK constraint so users get feedback before a round-trip
const PHONE_PATTERN = /^\+?[0-9 -]{7,15}$/

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at')
      .then(({ data }) => setContacts(data ?? []))
  }, [user])

  const addContact = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName) {
      setError('Add a name for this contact.')
      return
    }
    if (!PHONE_PATTERN.test(trimmedPhone)) {
      setError('Enter a valid phone number (digits, spaces, dashes; 7–15 characters).')
      return
    }
    setSaving(true)
    setError(null)
    const { data, error: dbError } = await supabase
      .from('emergency_contacts')
      .insert({ user_id: user.id, name: trimmedName, phone: trimmedPhone })
      .select()
      .single()
    setSaving(false)
    if (dbError || !data) {
      setError('Could not save the contact. Try again.')
      return
    }
    setContacts(c => [...c, data])
    setName('')
    setPhone('')
  }

  const removeContact = async (id: string) => {
    const previous = contacts
    setContacts(c => c.filter(x => x.id !== id))
    const { error: dbError } = await supabase.from('emergency_contacts').delete().eq('id', id)
    if (dbError) setContacts(previous)
  }

  return (
    <div className="mx-auto h-full max-w-md overflow-y-auto px-6 py-8">
      <h1 className="font-display text-2xl">Profile</h1>
      <p className="mt-1 truncate text-sm text-mist-400">{user?.email}</p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist-400">
          Emergency contacts
        </h2>
        <p className="mt-1 text-xs text-mist-400">
          The people your SOS reaches. Only you can see this list.
        </p>

        <ul className="mt-4 space-y-2">
          {contacts.map(c => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg bg-night-700 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-xs text-mist-400">{c.phone}</p>
              </div>
              <button
                onClick={() => removeContact(c.id)}
                aria-label={`Remove ${c.name}`}
                className="p-1.5 text-mist-400 hover:text-risk"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </li>
          ))}
          {contacts.length === 0 && (
            <li className="rounded-lg border border-dashed border-night-600 px-4 py-6 text-center text-sm text-mist-400">
              No contacts yet — add someone you trust below.
            </li>
          )}
        </ul>

        <form onSubmit={addContact} className="mt-4 space-y-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            placeholder="Name"
            aria-label="Contact name"
            className="w-full rounded-lg border border-night-600 bg-night-700 px-3.5 py-2.5 text-sm placeholder:text-mist-400 focus:border-lamp-400 focus:outline-none"
          />
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            type="tel"
            placeholder="Phone (e.g. +91 98765 43210)"
            aria-label="Contact phone"
            className="w-full rounded-lg border border-night-600 bg-night-700 px-3.5 py-2.5 text-sm placeholder:text-mist-400 focus:border-lamp-400 focus:outline-none"
          />
          {error && <p className="text-sm text-risk">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-lamp-400 py-2.5 font-semibold text-night-900 disabled:opacity-40"
          >
            {saving ? 'Adding…' : 'Add contact'}
          </button>
        </form>
      </section>

      <button
        onClick={signOut}
        className="mt-10 w-full rounded-lg border border-night-600 py-2.5 text-sm text-mist-400 hover:text-mist-100"
      >
        Sign out
      </button>
    </div>
  )
}
