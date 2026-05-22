'use client'

import { useState } from 'react'
import { approvePointRequest, denyPointRequest } from './actions'

interface Props {
  request: {
    id: string
    description: string
    points_requested: number
    member?: { full_name: string | null; email: string } | null
    created_at: string
  }
  execProfileId: string
}

export function ExecReviewCard({ request, execProfileId }: Props) {
  const [points, setPoints] = useState(request.points_requested)
  const [pending, setPending] = useState(false)

  async function handleApprove() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', request.id)
    fd.append('points_awarded', points.toString())
    fd.append('reviewed_by', execProfileId)
    await approvePointRequest(fd)
    setPending(false)
  }

  async function handleDeny() {
    if (!confirm('Deny this request?')) return
    setPending(true)
    await denyPointRequest(request.id, execProfileId)
    setPending(false)
  }

  const memberName = request.member?.full_name ?? request.member?.email ?? 'Unknown'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-sm text-gray-900">{memberName}</p>
          <p className="text-sm text-gray-600 mt-0.5">{request.description}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(request.created_at).toLocaleDateString()}</p>
        </div>
        <p className="text-xs text-gray-400 shrink-0">Requested: {request.points_requested} pts</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600">Award pts:</label>
          <input
            type="number"
            min="0"
            value={points}
            onChange={e => setPoints(parseInt(e.target.value) || 0)}
            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <button
          onClick={handleApprove}
          disabled={pending}
          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          Approve
        </button>
        <button
          onClick={handleDeny}
          disabled={pending}
          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          Deny
        </button>
      </div>
    </div>
  )
}
