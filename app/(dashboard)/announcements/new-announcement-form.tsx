'use client'

import { useState } from 'react'
import { createAnnouncement } from './actions'

type Role = 'member' | 'social_chair' | 'rush_chair' | 'exec'

const TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  chapter: { label: 'Chapter',  color: 'bg-gray-100 text-gray-700' },
  social:  { label: 'Social',   color: 'bg-blue-100 text-blue-700' },
  rush:    { label: 'Rush',     color: 'bg-purple-100 text-purple-700' },
  exec:    { label: 'Exec',     color: 'bg-yellow-100 text-yellow-700' },
  alumni:  { label: 'Alumni',   color: 'bg-green-100 text-green-700' },
  ra:      { label: 'RA',       color: 'bg-orange-100 text-orange-700' },
}

const ROLE_TYPES: Record<Role, string[]> = {
  member:       [],
  social_chair: ['social'],
  rush_chair:   ['rush'],
  exec:         ['chapter', 'social', 'rush', 'exec', 'alumni', 'ra'],
}

export function NewAnnouncementForm({ profileId, role }: { profileId: string; role: Role }) {
  const allowedTypes = ROLE_TYPES[role]
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [type, setType] = useState(allowedTypes[0] ?? 'chapter')

  if (allowedTypes.length === 0) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    fd.append('profileId', profileId)
    fd.append('type', type)
    await createAnnouncement(fd)
    setPending(false)
    setOpen(false)
    ;(e.target as HTMLFormElement).reset()
    setType(allowedTypes[0])
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold rounded-xl text-sm transition-colors"
      >
        + New Announcement
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">New Announcement</h2>

      {/* Type selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {allowedTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${
                type === t
                  ? `${TYPE_OPTIONS[t].color} border-current`
                  : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'
              }`}
            >
              {TYPE_OPTIONS[t].label}
            </button>
          ))}
        </div>
      </div>

      <input
        name="title"
        required
        placeholder="Title"
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <textarea
        name="content"
        required
        rows={4}
        placeholder="Write your announcement..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-zinc-900 font-semibold rounded-lg text-sm transition-colors"
        >
          {pending ? 'Posting…' : 'Post'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
