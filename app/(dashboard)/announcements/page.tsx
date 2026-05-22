import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewAnnouncementForm } from './new-announcement-form'
import { AnnouncementCard } from './announcement-card'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: announcements }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!created_by(id, full_name, email),
        comments:announcement_comments(
          id, content, created_at,
          author:profiles!created_by(id, full_name, email)
        )
      `)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/no-access')

  const canPost = ['exec', 'social_chair', 'rush_chair'].includes(profile.role)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
      {canPost && <NewAnnouncementForm profileId={profile.id} />}
      <div className="space-y-4">
        {announcements?.map(a => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            currentProfileId={profile.id}
            currentRole={profile.role}
          />
        ))}
        {!announcements?.length && (
          <div className="text-center py-16 text-gray-400 text-sm">No announcements yet.</div>
        )}
      </div>
    </div>
  )
}
