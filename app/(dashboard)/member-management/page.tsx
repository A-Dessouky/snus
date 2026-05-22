import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddMemberModal } from './add-member-modal'
import { RemoveButton, RoleSelect } from './member-actions'
import type { Role } from '@/lib/types'

const ROLE_COLORS: Record<Role, string> = {
  member:       'bg-gray-100 text-gray-600',
  social_chair: 'bg-blue-100 text-blue-700',
  rush_chair:   'bg-purple-100 text-purple-700',
  exec:         'bg-yellow-100 text-yellow-700',
}

export default async function MemberManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id, role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'exec') redirect('/home')

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  const active  = members?.filter(m => m.user_id !== null) ?? []
  const pending = members?.filter(m => m.user_id === null) ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} active · {pending.length} pending</p>
        </div>
        <AddMemberModal />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        Add a member by entering their Stanford email and assigning a role. They can log in immediately with that Google account.
      </div>

      {/* Pending — added but never logged in */}
      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pending First Login ({pending.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{m.email}</td>
                    <td className="px-4 py-3">
                      <RoleSelect id={m.id} currentRole={m.role} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RemoveButton id={m.id} name={m.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Active members */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Active Members ({active.length})
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(m => (
                <tr key={m.id} className={`hover:bg-gray-50 ${m.id === profile.id ? 'bg-yellow-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-yellow-400 shrink-0">
                        {(m.full_name ?? m.email)[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {m.full_name ?? '—'}
                        {m.id === profile.id && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    {m.id === profile.id ? (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[m.role as Role]}`}>
                        {m.role.replace('_', ' ')}
                      </span>
                    ) : (
                      <RoleSelect id={m.id} currentRole={m.role} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.id !== profile.id && (
                      <RemoveButton id={m.id} name={m.full_name ?? m.email} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
