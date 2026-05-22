'use client'

import { useState } from 'react'
import { createAnnouncement } from './actions'

export function NewAnnouncementForm({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    fd.append('profileId', profileId)
    await createAnnouncement(fd)
    setPending(false)
    setOpen(false)
    ;(e.target as HTMLFormElement).reset()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium transition-colors"
      >
        + New Announcement
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">New Announcement</h2>
      <input
        name="title"
        required
        placeholder="Title"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      <textarea
        name="content"
        required
        rows={4}
        placeholder="Write your announcement..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {pending ? 'Posting…' : 'Post'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
