import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin, CheckSquare } from 'lucide-react'
import { MiniCalendar } from '@/components/mini-calendar'
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
    { data: monthEvents },
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
    supabase.from('events').select('id, title, start_time')
      .gte('start_time', new Date(today.getFullYear(), today.getMonth(), 1).toISOString())
      .lt('start_time', new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()),
  ])

  const openTasks = myTasks?.length ?? 0
  const myPhilHours = philHours?.reduce((s, r) => s + (r.hours_awarded ?? 0), 0) ?? 0
  const unpaidDues = allDues?.filter(d => !d.paid) ?? []
  const duesPaid = unpaidDues.length === 0
  const earliestDue = unpaidDues[0]
  const isOverdue = earliestDue ? new Date(earliestDue.due_date) < today : false

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
    <div className="w-full space-y-5">

      {/* ── Hero — dark card with embedded stats ── */}
      <div className="rounded-3xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1a1a1f 0%, #111114 60%, #0d0d10 100%)',
        boxShadow: '0 24px 64px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        <div className="px-7 pt-7 pb-5">
          {/* Greeting */}
          <p className="text-zinc-500 text-xs">{dateStr}</p>
          <h1 className="text-3xl font-bold text-white mt-1 tracking-tight">{greeting()}, {displayName}.</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="bg-yellow-500/15 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/20">
              {ROLE_LABELS[profile.role as Role]}
            </span>
            {openTasks > 0 && (
              <Link href="/task-board" className="flex items-center gap-1.5 bg-white/6 hover:bg-white/10 text-zinc-400 text-xs px-3 py-1 rounded-full border border-white/8 transition-colors">
                <CheckSquare className="w-3 h-3" /> {openTasks} task{openTasks !== 1 ? 's' : ''} open
              </Link>
            )}
          </div>
        </div>

        {/* Embedded stat tiles */}
        <div className="px-7 pb-6">
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Link href="/house-points" className="rounded-2xl p-4 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)') as any}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)') as any}
            >
              <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Rank</p>
              <p className="text-3xl font-bold text-white mt-1">{myRank > 0 ? `#${myRank}` : '—'}</p>
              <p className="text-zinc-600 text-xs mt-0.5">of {totalMembers} members</p>
            </Link>
            <Link href="/philanthropy" className="rounded-2xl p-4 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Philanthropy</p>
              <p className="text-3xl font-bold text-white mt-1">{myPhilHours}<span className="text-lg text-zinc-400">h</span></p>
              <p className="text-zinc-600 text-xs mt-0.5">hours logged</p>
            </Link>
            <Link href="/dues" className="rounded-2xl p-4 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Dues</p>
              <p className={`text-3xl font-bold mt-1 ${duesPaid ? 'text-green-400' : isOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                {duesPaid ? 'Paid' : isOverdue ? 'Late' : 'Due'}
              </p>
              <p className="text-zinc-600 text-xs mt-0.5">
                {duesPaid ? 'All clear' : `By ${fmtDueDate(earliestDue!.due_date)}`}
              </p>
            </Link>
          </div>
        </div>

        {/* Upcoming events */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <div className="px-7 pb-7 space-y-2">
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} className="mb-4" />
            <p className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mb-3">Upcoming</p>
            {upcomingEvents.map((e, i) => (
              <Link
                key={e.id}
                href="/social-calendar"
                className="flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors"
                style={{
                  background: i === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: i === 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                }}
              >
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  i === 0 ? 'bg-yellow-500 text-zinc-900' : 'bg-white/10 text-zinc-500'
                }`}>
                  {daysUntil(e.start_time)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate text-sm ${i === 0 ? 'text-white' : 'text-zinc-500'}`}>{e.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-zinc-600 text-xs">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtEventDate(e.start_time)} · {fmtEventTime(e.start_time)}</span>
                    {e.location && <span className="hidden sm:flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Announcements + Calendar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 glass-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="font-semibold text-gray-900">Announcements</h2>
            <Link href="/announcements" className="text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {announcements && announcements.length > 0 ? (
            <ul>
              {announcements.map((a, i) => (
                <li key={a.id} className="px-6 py-4" style={{ borderBottom: i < announcements.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
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
            <div className="px-6 py-12 text-center text-sm text-gray-400">No announcements yet.</div>
          )}
        </div>

        <div className="md:col-span-1">
          <MiniCalendar events={monthEvents ?? []} />
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="font-semibold text-gray-900">House Points Leaderboard</h2>
          <Link href="/house-points" className="text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 transition-colors">
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {fullLeaderboard.slice(0, 10).map((m, i) => {
            const isMe = m.id === profile.id
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={m.id} className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${isMe ? 'bg-yellow-500/5' : 'hover:bg-black/[0.02]'}`}
                style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="w-7 text-center shrink-0">
                  {i < 3
                    ? <span className="text-base">{medals[i]}</span>
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
        </div>
      </div>
    </div>
  )
}
