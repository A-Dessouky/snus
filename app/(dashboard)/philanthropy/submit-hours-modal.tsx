'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { submitHours } from './actions'

export function SubmitHoursModal({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    fd.append('member_id', profileId)
    await submitHours(fd)
    setPending(false)
    setOpen(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold rounded-lg text-sm transition-colors">
        + Log Hours
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Philanthropy Hours</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">What did you do? *</label>
                <textarea name="description" required rows={3} placeholder="Describe your philanthropy activity…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hours *</label>
                <input name="hours_requested" type="number" min="0.5" step="0.5" required placeholder="e.g. 2.5" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-zinc-900 font-semibold rounded-lg text-sm transition-colors">
                  {pending ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
