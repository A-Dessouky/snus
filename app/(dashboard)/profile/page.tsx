import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, CheckSquare, CreditCard, Mail, Phone } from 'lucide-react'
import type { Role } from '@/lib/types'

const ROLE_LABELS: Record<Role, string> = {
  member: 'Member', social_chair: 'Social Chair', rush_chair: 'Rush Chair', exec: 'Exec',
}

const ROLE_COLORS: Record<Role, string> = {
  member: 'bg-gray-100 text-gray-600',
  social_chair: 'bg-blue-100 text-blue-700',
  rush_chair: 'bg-purple-100 text-purple-700',
  exec: 'bg-yellow-100 text-yellow-700',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/no-access')

  const [{ data: pointRequests }, { data: tasks }, { data: dues }] = await Promise.all([
    supabase.from('house_point_requests').select('*').eq('member_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*, creator:profiles!created_by(full_name)').eq('assigned_to', profile.id).order('created_at', { ascending: false }),
    supabase.from('dues').select('*').eq('member_id', profile.id).order('due_date', { ascending: false }),
  ])

  const totalPoints = pointRequests?.filter(r => r.status === 'approved').reduce((s, r) => s + (r.points_awarded ?? 0), 0) ?? 0
  const completedTasks = tasks?.filter(t => t.status === 'complete').length ?? 0
  const unpaidDues = dues?.filter(d => !d.paid).length ?? 0

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-2xl font-bold text-zinc-900 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{profile.full_name ?? 'No name set'}</h2>
            <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[profile.role as Role]}`}>
              {ROLE_LABELS[profile.role as Role]}
            </span>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {profile.email}
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {profile.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            <p className="text-xs text-gray-500 mt-0.5">House Points</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
            <p className="text-xs text-gray-500 mt-0.5">Tasks Done</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${unpaidDues > 0 ? 'text-red-600' : 'text-green-600'}`}>{unpaidDues}</p>
            <p className="text-xs text-gray-500 mt-0.5">Unpaid Dues</p>
          </div>
        </div>
      </div>

      {/* My tasks */}
      {(tasks?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5" /> My Tasks
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {tasks?.map(task => (
              <div key={task.id} className="flex items-center gap-4 px-4 py-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'complete' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <p className={`flex-1 text-sm ${task.status === 'complete' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                {task.due_date && <p className="text-xs text-gray-400 shrink-0">{task.due_date}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My house points history */}
      {(pointRequests?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> House Points History
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {pointRequests?.map(req => (
              <div key={req.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{req.description}</p>
                  <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  {req.status === 'approved' && (
                    <span className="text-sm font-semibold text-green-600">+{req.points_awarded} pts</span>
                  )}
                  {req.status === 'denied' && (
                    <span className="text-xs text-red-500">Denied</span>
                  )}
                  {req.status === 'pending' && (
                    <span className="text-xs text-yellow-600">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dues */}
      {(dues?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Dues
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {dues?.map(due => (
              <div key={due.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{due.semester}</p>
                  <p className="text-xs text-gray-400">Due {due.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${Number(due.amount).toFixed(2)}</p>
                  <span className={`text-xs font-medium ${due.paid ? 'text-green-600' : 'text-red-500'}`}>
                    {due.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
