import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewAnnouncementForm } from './new-announcement-form'
import { AnnouncementCard } from './announcement-card'
import type { Role } from '@/lib/types'

// Which announcement types each role can see
const VISIBLE_TYPES: Record<string, string[]> = {
  member:       ['chapter', 'social', 'rush'],
  social_chair: ['chapter', 'social', 'rush'],
  rush_chair:   ['chapter', 'social', 'rush'],
  exec:         ['chapter', 'social', 'rush', 'exec', 'alumni', 'ra'],
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  chapter: { label: 'Chapter', color: 'bg-gray-100 text-gray-700' },
  social:  { label: 'Social',  color: 'bg-blue-100 text-blue-700' },
  rush:    { label: 'Rush',    color: 'bg-purple-100 text-purple-700' },
  exec:    { label: 'Exec',    color: 'bg-yellow-100 text-yellow-700' },
  alumni:  { label: 'Alumni',  color: 'bg-green-100 text-green-700' },
  ra:      { label: 'RA',      color: 'bg-orange-100 text-orange-700' },
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/no-access')

  const visibleTypes = VISIBLE_TYPES[profile.role] ?? ['chapter', 'social', 'rush']

  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!created_by(id, full_name, email),
      comments:announcement_comments(
        id, content, created_at,
        author:profiles!created_by(id, full_name, email)
      )
    `)
    .in('type', visibleTypes)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
      <NewAnnouncementForm profileId={profile.id} role={profile.role as Role} />
      <div className="space-y-4">
        {announcements?.map(a => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            currentProfileId={profile.id}
            currentRole={profile.role}
            typeMeta={TYPE_META[a.type] ?? TYPE_META.chapter}
          />
        ))}
        {!announcements?.length && (
          <div className="text-center py-16 text-gray-400 text-sm">No announcements yet.</div>
        )}
      </div>
    </div>
  )
}
