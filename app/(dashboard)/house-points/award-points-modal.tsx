'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { awardPoints } from './actions'

interface Member { id: string; full_name: string | null; email: string }

export function AwardPointsModal({ execProfileId, members }: { execProfileId: string; members: Member[] }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    fd.append('exec_id', execProfileId)
    await awardPoints(fd)
    setPending(false)
    setOpen(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-full text-sm transition-colors">
        + Award Points
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Award Points</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Member *</label>
                <select name="member_id" required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  <option value="">Select a member…</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Points *</label>
                <input name="points" type="number" min="1" required placeholder="e.g. 10" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                <input name="description" placeholder="What did they do?" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-zinc-900 font-semibold rounded-full text-sm transition-colors">
                  {pending ? 'Awarding…' : 'Award Points'}
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
