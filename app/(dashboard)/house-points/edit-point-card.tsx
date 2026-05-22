'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { editPointRequest, deletePointRequest } from './actions'

interface Props {
  request: {
    id: string
    description: string
    points_awarded: number | null
    member?: { full_name: string | null; email: string } | null
    created_at: string
  }
}

export function EditPointCard({ request }: Props) {
  const [editing, setEditing] = useState(false)
  const [points, setPoints] = useState(request.points_awarded ?? 0)
  const [pending, setPending] = useState(false)

  async function handleSave() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', request.id)
    fd.append('points_awarded', points.toString())
    await editPointRequest(fd)
    setPending(false)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Remove this house point entry?')) return
    setPending(true)
    await deletePointRequest(request.id)
    setPending(false)
  }

  const memberName = request.member?.full_name ?? request.member?.email ?? 'Unknown'

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{memberName}</p>
        <p className="text-xs text-gray-400 truncate">{request.description}</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            value={points}
            onChange={e => setPoints(parseInt(e.target.value) || 0)}
            className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <span className="text-xs text-gray-400">pts</span>
          <button onClick={handleSave} disabled={pending} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-900">{request.points_awarded} pts</span>
          <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete} disabled={pending} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
