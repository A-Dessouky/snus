import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/no-access')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const unread = notifications?.filter(n => !n.read) ?? []
  const read = notifications?.filter(n => n.read) ?? []

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unread.length > 0 && (
          <button className="text-sm text-yellow-500 hover:text-yellow-600 font-medium">
            Mark all read
          </button>
        )}
      </div>

      {unread.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            New ({unread.length})
          </h2>
          {unread.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4 flex gap-4">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {read.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Earlier</h2>
          {read.map(n => (
            <div key={n.id} className="card p-4 flex gap-4 opacity-60">
              <Bell className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {!notifications?.length && (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No notifications yet.
        </div>
      )}
    </div>
  )
}
