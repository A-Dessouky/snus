import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { SubmitRequestModal } from './submit-request-modal'
import { ExecReviewCard } from './exec-review-card'
import { AwardPointsModal } from './award-points-modal'

export default async function HousePointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: members }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('id, role, is_president').eq('user_id', user.id).single(),
    supabase.from('profiles').select('id, full_name, email').order('full_name'),
    supabase
      .from('house_point_requests')
      .select('*, member:profiles!member_id(full_name, email)')
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/no-access')

  const isExec = profile.role === 'exec'

  // Leaderboard: sum approved points per member
  const pointMap: Record<string, number> = {}
  requests?.filter(r => r.status === 'approved').forEach(r => {
    pointMap[r.member_id] = (pointMap[r.member_id] ?? 0) + (r.points_awarded ?? 0)
  })
  const leaderboard = (members ?? [])
    .map(m => ({ ...m, points: pointMap[m.id] ?? 0 }))
    .sort((a, b) => b.points - a.points)

  const pendingRequests = requests?.filter(r => r.status === 'pending') ?? []

  // My recent requests (non-exec)
  const myRequests = requests?.filter(r => r.member_id === profile.id).slice(0, 5) ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">House Points</h1>
        <div className="flex gap-2">
          {profile.is_president && <AwardPointsModal execProfileId={profile.id} members={members ?? []} />}
          <SubmitRequestModal profileId={profile.id} />
        </div>
      </div>

      {/* Exec: pending review queue */}
      {isExec && pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pending Review ({pendingRequests.length})
          </h2>
          {pendingRequests.map(req => (
            <ExecReviewCard
              key={req.id}
              request={req as any}
              execProfileId={profile.id}
            />
          ))}
        </section>
      )}

      {/* Leaderboard */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h2 className="font-semibold text-gray-900">Leaderboard</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {leaderboard.map((m, i) => (
            <li key={m.id} className={`flex items-center gap-4 px-5 py-3 ${m.id === profile.id ? 'bg-yellow-50' : ''}`}>
              <span className={`w-6 text-sm font-bold ${i === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{i + 1}</span>
              <span className="flex-1 text-sm text-gray-900">
                {m.full_name ?? m.email}
                {m.id === profile.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
              </span>
              <span className="text-sm font-semibold text-gray-900">{m.points} pts</span>
            </li>
          ))}
        </ul>
      </section>

      {/* My request history */}
      {!isExec && myRequests.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">My Requests</h2>
          <div className="card overflow-hidden divide-y divide-gray-100">
            {myRequests.map(req => (
              <div key={req.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{req.description}</p>
                  <p className="text-xs text-gray-400">{req.points_requested} pts requested</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  req.status === 'approved' ? 'bg-green-100 text-green-700' :
                  req.status === 'denied'   ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {req.status === 'approved' ? `+${req.points_awarded} pts` : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
