import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, CreditCard, Heart, ArrowRight, Clock, MapPin, CheckSquare } from 'lucide-react'
import type { Role } from '@/lib/types'

const ROLE_LABELS: Record<Role, string> = {
  member: 'Member', social_chair: 'Social Chair', rush_chair: 'Rush Chair', exec: 'Exec',
}

const TYPE_COLORS: Record<string, string> = {
  chapter: 'bg-gray-100 text-gray-600',
  social:  'bg-blue-100 text-blue-700',
  rush:    'bg-purple-100 text-purple-700',
  exec:    'bg-zinc-100 text-zinc-700',
  alumni:  'bg-green-100 text-green-700',
  ra:      'bg-orange-100 text-orange-700',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  const d = Math.round(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `${d}d`
}

function fmtDueDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/no-access')

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const displayName = profile.full_name ?? profile.email.split('@')[0]

  const [
    { data: announcements },
    { data: upcomingEvents },
    { data: myTasks },
    { data: allPointRequests },
    { data: members },
    { data: allDues },
    { data: philHours },
  ] = await Promise.all([
    supabase.from('announcements')
      .select('*, author:profiles!created_by(full_name, email)')
      .in('type', ['chapter', 'social', 'rush'])
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('events').select('*').gte('start_time', today.toISOString()).order('start_time').limit(3),
    supabase.from('tasks').select('id').eq('assigned_to', profile.id).neq('status', 'complete'),
    supabase.from('house_point_requests').select('member_id, points_awarded').eq('status', 'approved'),
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('dues').select('*').eq('member_id', profile.id).order('due_date'),
    supabase.from('philanthropy_hours').select('hours_awarded').eq('member_id', profile.id).eq('status', 'approved'),
  ])

  const openTasks = myTasks?.length ?? 0
  const myPhilHours = philHours?.reduce((s, r) => s + (r.hours_awarded ?? 0), 0) ?? 0

  // Dues status
  const unpaidDues = allDues?.filter(d => !d.paid) ?? []
  const duesPaid = unpaidDues.length === 0
  const earliestDue = unpaidDues[0]
  const isOverdue = earliestDue ? new Date(earliestDue.due_date) < today : false

  // Leaderboard + rank
  const pointMap: Record<string, number> = {}
  allPointRequests?.forEach(r => {
    pointMap[r.member_id] = (pointMap[r.member_id] ?? 0) + (r.points_awarded ?? 0)
  })
  const myPoints = pointMap[profile.id] ?? 0
  const fullLeaderboard = (members ?? [])
    .map(m => ({ ...m, points: pointMap[m.id] ?? 0 }))
    .sort((a, b) => b.points - a.points)
  const myRank = fullLeaderboard.findIndex(m => m.id === profile.id) + 1
  const totalMembers = fullLeaderboard.length

  return (
    <div className="w-full space-y-6">

      {/* ── Hero ── */}
      <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        <div className="relative px-6 md:px-8 py-7 md:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-zinc-500 text-xs md:text-sm">{dateStr}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">{greeting()}, {displayName}.</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full">
                  {ROLE_LABELS[profile.role as Role]}
                </span>
                {openTasks > 0 && (
                  <Link href="/task-board" className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-zinc-300 text-xs px-3 py-1 rounded-full transition-colors">
                    <CheckSquare className="w-3 h-3" /> {openTasks} task{openTasks !== 1 ? 's' : ''} open
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming events mini-list */}
          {upcomingEvents && upcomingEvents.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Upcoming</p>
              {upcomingEvents.map((e, i) => (
                <Link
                  key={e.id}
                  href="/social-calendar"
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${
                    i === 0 ? 'bg-white/8 hover:bg-white/12 border border-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="shrink-0 text-center w-10">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      i === 0 ? 'bg-yellow-500 text-zinc-900' : 'bg-white/10 text-zinc-400'
                    }`}>
                      {daysUntil(e.start_time)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${i === 0 ? 'text-white' : 'text-zinc-400'}`}>{e.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-zinc-500 text-xs">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtEventDate(e.start_time)} at {fmtEventTime(e.start_time)}</span>
                      {e.location && <span className="flex items-center gap-1 hidden sm:flex"><MapPin className="w-3 h-3" />{e.location}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Rank */}
        <Link href="/house-points" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
          <Trophy className="w-5 h-5 text-gray-400 mb-3" />
          <p className="text-2xl font-bold text-gray-900">
            {myRank > 0 ? `#${myRank}` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {myRank > 0 ? `of ${totalMembers} members` : 'No points yet'}
          </p>
        </Link>

        {/* Philanthropy */}
        <Link href="/philanthropy" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
          <Heart className="w-5 h-5 text-gray-400 mb-3" />
          <p className="text-2xl font-bold text-gray-900">{myPhilHours}h</p>
          <p className="text-xs text-gray-500 mt-0.5">Philanthropy</p>
        </Link>

        {/* Dues */}
        <Link href="/dues" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
          <CreditCard className={`w-5 h-5 mb-3 ${duesPaid ? 'text-green-500' : isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
          <p className={`text-2xl font-bold ${duesPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {duesPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Due'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {duesPaid
              ? allDues?.find(d => d.paid)?.semester ?? 'All clear'
              : `By ${fmtDueDate(earliestDue!.due_date)}`}
          </p>
        </Link>
      </div>

      {/* ── Recent announcements ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Announcements</h2>
          <Link href="/announcements" className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {announcements && announcements.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {announcements.map(a => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type ?? 'chapter']}`}>
                    {(a.type ?? 'chapter').charAt(0).toUpperCase() + (a.type ?? 'chapter').slice(1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {(a.author as any)?.full_name ?? (a.author as any)?.email} · {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No announcements yet.</div>
        )}
      </div>

      {/* ── Full-width leaderboard ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">House Points Leaderboard</h2>
          <Link href="/house-points" className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {fullLeaderboard.slice(0, 10).map((m, i) => {
            const isMe = m.id === profile.id
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={m.id} className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-gray-50' : ''}`}>
                <span className="w-8 text-center shrink-0">
                  {i < 3
                    ? <span className="text-lg">{medals[i]}</span>
                    : <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                  }
                </span>
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(m.full_name ?? m.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.full_name ?? m.email.split('@')[0]}
                    {isMe && <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{m.points}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>
            )
          })}
          {fullLeaderboard.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No points recorded yet.</div>
          )}
        </div>
      </div>

    </div>
  )
}
