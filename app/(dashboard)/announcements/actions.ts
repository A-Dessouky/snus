'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createAnnouncement(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const profileId = formData.get('profileId') as string
  if (!title.trim() || !content.trim()) return
  await adminClient().from('announcements').insert({ title, content, created_by: profileId })
  revalidatePath('/announcements')
}

export async function updateAnnouncement(formData: FormData) {
  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  if (!title.trim() || !content.trim()) return
  await adminClient().from('announcements').update({ title, content }).eq('id', id)
  revalidatePath('/announcements')
}

export async function deleteAnnouncement(id: string) {
  await adminClient().from('announcements').delete().eq('id', id)
  revalidatePath('/announcements')
}

export async function createComment(formData: FormData) {
  const announcementId = formData.get('announcementId') as string
  const content = formData.get('content') as string
  const profileId = formData.get('profileId') as string
  if (!content.trim()) return
  await adminClient().from('announcement_comments').insert({ announcement_id: announcementId, content, created_by: profileId })
  revalidatePath('/announcements')
}
