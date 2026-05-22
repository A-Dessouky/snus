'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function createEvent(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const created_by = formData.get('created_by') as string

  if (!title.trim() || !date || !time) return

  await adminClient().from('events').insert({
    title,
    description: description || null,
    location: location || null,
    start_time: `${date}T${time}:00`,
    created_by,
  })

  revalidatePath('/social-calendar')
}

export async function updateEvent(formData: FormData) {
  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string

  if (!title.trim() || !date || !time) return

  await adminClient().from('events').update({
    title,
    description: description || null,
    location: location || null,
    start_time: `${date}T${time}:00`,
  }).eq('id', id)

  revalidatePath('/social-calendar')
}

export async function deleteEvent(id: string) {
  await adminClient().from('events').delete().eq('id', id)
  revalidatePath('/social-calendar')
}
