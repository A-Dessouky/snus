'use client'

import { useState } from 'react'
import { MessageSquare, Pencil, Trash2, X, Check } from 'lucide-react'
import { updateAnnouncement, deleteAnnouncement, createComment } from './actions'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  chapter: { label: 'Chapter', color: 'bg-gray-100 text-gray-700' },
  social:  { label: 'Social',  color: 'bg-blue-100 text-blue-700' },
  rush:    { label: 'Rush',    color: 'bg-purple-100 text-purple-700' },
  exec:    { label: 'Exec',    color: 'bg-yellow-100 text-yellow-700' },
  alumni:  { label: 'Alumni',  color: 'bg-green-100 text-green-700' },
  ra:      { label: 'RA',      color: 'bg-orange-100 text-orange-700' },
}

const EXEC_TYPES = ['chapter', 'social', 'rush', 'exec', 'alumni', 'ra']

interface Props {
  announcement: any
  currentProfileId: string
  currentRole: string
  typeMeta: { label: string; color: string }
}

export function AnnouncementCard({ announcement: a, currentProfileId, currentRole, typeMeta }: Props) {
  const [editing, setEditing] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [pending, setPending] = useState(false)
  const [editType, setEditType] = useState(a.type ?? 'chapter')

  const canEdit = a.author?.id === currentProfileId || currentRole === 'exec'
  const sortedComments = [...(a.comments ?? [])].sort(
    (x: any, y: any) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
  )

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    fd.append('type', editType)
    await updateAnnouncement(fd)
    setPending(false)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this announcement?')) return
    await deleteAnnouncement(a.id)
  }

  async function handleComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    await createComment(new FormData(e.currentTarget))
    setPending(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div className="card">
      <div className="p-5">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-3">
            <input type="hidden" name="id" value={a.id} />
            {/* Type selector for exec */}
            {currentRole === 'exec' && (
              <div className="flex flex-wrap gap-2">
                {EXEC_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${
                      editType === t
                        ? `${TYPE_OPTIONS[t].color} border-current`
                        : 'bg-gray-50 text-gray-400 border-transparent'
                    }`}
                  >
                    {TYPE_OPTIONS[t].label}
                  </button>
                ))}
              </div>
            )}
            <input
              name="title"
              defaultValue={a.title}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <textarea
              name="content"
              defaultValue={a.content}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-zinc-900 rounded-full text-xs font-semibold">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeMeta.color}`}>
                  {typeMeta.label}
                </span>
                <h2 className="font-semibold text-gray-900">{a.title}</h2>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {a.author?.full_name ?? a.author?.email} · {timeAgo(a.created_at)}
              </p>
              <button
                onClick={() => setShowComments(v => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-yellow-600 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {sortedComments.length > 0 ? `${sortedComments.length} comment${sortedComments.length !== 1 ? 's' : ''}` : 'Comment'}
              </button>
            </div>
          </>
        )}
      </div>

      {showComments && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {sortedComments.length > 0 && (
            <div className="space-y-3">
              {sortedComments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {(c.author?.full_name ?? c.author?.email ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-gray-700">{c.author?.full_name ?? c.author?.email}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{c.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleComment} className="flex gap-2">
            <input type="hidden" name="announcementId" value={a.id} />
            <input type="hidden" name="profileId" value={currentProfileId} />
            <input
              name="content"
              placeholder="Write a comment…"
              required
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
