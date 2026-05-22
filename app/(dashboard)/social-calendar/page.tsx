import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarGrid } from './calendar-grid'
import { AddEventModal } from './add-event-modal'

export default async function SocialCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from('profiles').select('id, role').eq('user_id', user.id).single(),
    supabase.from('events').select('*').order('start_time'),
  ])

  if (!profile) redirect('/no-access')

  const canManage = ['exec', 'social_chair'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Social Calendar</h1>
        {canManage && <AddEventModal profileId={profile.id} />}
      </div>
      <CalendarGrid events={events ?? []} canManage={canManage} />
    </div>
  )
}
