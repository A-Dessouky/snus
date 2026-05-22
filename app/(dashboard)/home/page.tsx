import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckSquare, Trophy, CreditCard, Bell, ArrowRight, Clock, Heart } from 'lucide-react'
import type { Role } from '@/lib/types'

const ROLE_LABELS: Record<Role, string> = {
  member: 'Member', social_chair: 'Social Chair', rush_chair: 'Rush Chair', exec: 'Exec',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  const days = Math.round(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/no-access')

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const firstName = profile.full_name?.split(' ')[0] ?? profile.email.split('@')[0]

  const [
    { data: announcements },
    { data: nextEvents },
    { data: myTasks },
    { data: allPointRequests },
    { data: members },
    { data: dues },
    { data: notifications },
    { data: philHours },
  ] = await Promise.all([
    supabase.from('announcements').select('*, author:profiles!created_by(full_name, email)').order('created_at', { ascending: false }).limit(3),
    supabase.from('events').select('*').gte('start_time', today.toISOString()).order('start_time').limit(1),
    supabase.from('tasks').select('*, assignee:profiles!assigned_to(full_name)').eq('assigned_to', profile.id).neq('status', 'complete').order('due_date'),
    supabase.from('house_point_requests').select('member_id, points_awarded').eq('status', 'approved'),
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('dues').select('*').eq('member_id', profile.id).eq('paid', false),
    supabase.from('notifications').select('id').eq('user_id', profile.id).eq('read', false),
    supabase.from('philanthropy_hours').select('hours_awarded').eq('member_id', profile.id).eq('status', 'approved'),
  ])

  const nextEvent = nextEvents?.[0]
  const unpaidDues = dues?.length ?? 0
  const duesPaid = unpaidDues === 0
  const myPhilHours = philHours?.reduce((s, r) => s + (r.hours_awarded ?? 0), 0) ?? 0
  const unreadNotifs = notifications?.length ?? 0
  const openTasks = myTasks?.length ?? 0

  // Build leaderboard
  const pointMap: Record<string, number> = {}
  allPointRequests?.forEach(r => {
    pointMap[r.member_id] = (pointMap[r.member_id] ?? 0) + (r.points_awarded ?? 0)
  })
  const myPoints = pointMap[profile.id] ?? 0
  const leaderboard = (members ?? [])
    .map(m => ({ ...m, points: pointMap[m.id] ?? 0 }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
  const myRank = leaderboard.findIndex(m => m.id === profile.id) + 1

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Hero card */}
      <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <p className="text-zinc-400 text-sm">{dateStr}</p>
              <h1 className="text-3xl font-bold text-white">{greeting()}, {firstName}.</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {ROLE_LABELS[profile.role as Role]}
                </span>
                {openTasks > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full">
                    <CheckSquare className="w-3 h-3" /> {openTasks} task{openTasks !== 1 ? 's' : ''} pending
                  </span>
                )}
                {unreadNotifs > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1.5 rounded-full">
                    <Bell className="w-3 h-3" /> {unreadNotifs} new
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-5xl font-bold text-yellow-400">{myPoints}</p>
              <p className="text-zinc-400 text-sm mt-1">house points</p>
              {myRank > 0 && <p className="text-zinc-500 text-xs mt-0.5">#{myRank} on leaderboard</p>}
            </div>
          </div>

          {/* Next event inline */}
          {nextEvent && (
            <Link href="/social-calendar" className="mt-6 flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition-colors group">
              <div className="bg-yellow-500 rounded-lg p-2 shrink-0">
                <Clock className="w-4 h-4 text-zinc-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">Next Event</p>
                <p className="text-white font-semibold truncate">{nextEvent.title}</p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {formatEventDate(nextEvent.start_time)} at {formatEventTime(nextEvent.start_time)}
                  {nextEvent.location && <span> · {nextEvent.location}</span>}
                </p>
              </div>
              <span className="shrink-0 bg-yellow-500 text-zinc-900 text-xs font-bold px-2.5 py-1 rounded-full">
                {daysUntil(nextEvent.start_time)}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/house-points" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-yellow-200 transition-all">
          <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{myPoints}</p>
          <p className="text-xs text-gray-500 mt-0.5">House Points</p>
        </Link>

        <Link href="/philanthropy" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-yellow-200 transition-all">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{myPhilHours}h</p>
          <p className="text-xs text-gray-500 mt-0.5">Philanthropy</p>
        </Link>

        <Link href="/dues" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-yellow-200 transition-all">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${duesPaid ? 'bg-green-50' : 'bg-red-50'}`}>
            <CreditCard className={`w-5 h-5 ${duesPaid ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <p className={`text-2xl font-bold ${duesPaid ? 'text-green-600' : 'text-red-600'}`}>
            {duesPaid ? 'Paid' : 'Unpaid'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Dues Status</p>
        </Link>

        <Link href="/notifications" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-yellow-200 transition-all">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${unreadNotifs > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
            <Bell className={`w-5 h-5 ${unreadNotifs > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{unreadNotifs}</p>
          <p className="text-xs text-gray-500 mt-0.5">Notifications</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left column — next event + tasks */}
        <div className="col-span-1 md:col-span-3 space-y-5">

          {/* My open tasks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-gray-900">My Tasks</h2>
              </div>
              <Link href="/task-board" className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {myTasks && myTasks.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {myTasks.slice(0, 5).map(task => (
                  <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <span className="flex-1 text-sm text-gray-800">{task.title}</span>
                    {task.due_date && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${new Date(task.due_date) < new Date() ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {task.due_date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">You're all caught up!</div>
            )}
          </div>

          {/* Recent announcements */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Announcements</h2>
              <Link href="/announcements" className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {announcements && announcements.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {announcements.map(a => (
                  <li key={a.id} className="px-5 py-4">
                    <p className="font-medium text-sm text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {(a.author as any)?.full_name ?? (a.author as any)?.email} · {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No announcements yet.</div>
            )}
          </div>
        </div>

        {/* Right column — leaderboard */}
        <div className="col-span-1 md:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h2 className="font-semibold text-gray-900">Leaderboard</h2>
              </div>
              <Link href="/house-points" className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
                Full <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ul className="divide-y divide-gray-50">
              {leaderboard.map((m, i) => {
                const isMe = m.id === profile.id
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <li key={m.id} className={`flex items-center gap-3 px-5 py-3 ${isMe ? 'bg-yellow-50' : ''}`}>
                    <span className="text-base w-6 text-center shrink-0">
                      {i < 3 ? medals[i] : <span className="text-xs text-gray-400 font-bold">#{i + 1}</span>}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-yellow-400 shrink-0">
                      {(m.full_name ?? m.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-yellow-700' : 'text-gray-900'}`}>
                        {m.full_name ?? m.email.split('@')[0]}
                        {isMe && <span className="ml-1 text-xs text-yellow-500">(you)</span>}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 shrink-0">{m.points}</span>
                  </li>
                )
              })}
              {leaderboard.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-gray-400">No points yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
