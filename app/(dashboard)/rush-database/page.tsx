import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ProspectStatus } from '@/lib/types'

const STATUS_ORDER: ProspectStatus[] = ['prospect', 'invited', 'bid', 'pledge', 'member']
const STATUS_COLORS: Record<ProspectStatus, string> = {
  prospect: 'bg-gray-100 text-gray-600',
  invited:  'bg-blue-100 text-blue-700',
  bid:      'bg-purple-100 text-purple-700',
  pledge:   'bg-yellow-100 text-yellow-600',
  member:   'bg-green-100 text-green-700',
}

export default async function RushDatabasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: prospects }] = await Promise.all([
    supabase.from('profiles').select('role').eq('user_id', user.id).single(),
    supabase.from('rush_prospects').select('*').order('name'),
  ])

  if (!profile) redirect('/no-access')

  const grouped = STATUS_ORDER.map(status => ({
    status,
    items: (prospects ?? []).filter(p => p.status === status),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rush Database</h1>
        <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors">
          + Add Prospect
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {grouped.map(({ status, items }) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[status]}`}>
                {status}
              </span>
              <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            {items.map(p => (
              <div key={p.id} className="card p-3 space-y-1 cursor-pointer hover:border-yellow-300 transition-colors">
                {p.photo_url && (
                  <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover mb-2" />
                )}
                <p className="font-medium text-sm text-gray-900">{p.name}</p>
                {p.email && <p className="text-xs text-gray-400 truncate">{p.email}</p>}
                {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
              </div>
            ))}
            {!items.length && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-3 text-center text-xs text-gray-400">
                None
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
