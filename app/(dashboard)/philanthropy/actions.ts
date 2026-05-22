'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function submitHours(formData: FormData) {
  const member_id = formData.get('member_id') as string
  const description = formData.get('description') as string
  const hours_requested = parseFloat(formData.get('hours_requested') as string) || 0
  if (!description.trim()) return
  await adminClient().from('philanthropy_hours').insert({ member_id, description, hours_requested, status: 'pending' })
  revalidatePath('/philanthropy')
}

export async function approveHours(formData: FormData) {
  const id = formData.get('id') as string
  const hours_awarded = parseFloat(formData.get('hours_awarded') as string) || 0
  const reviewed_by = formData.get('reviewed_by') as string
  await adminClient().from('philanthropy_hours').update({
    status: 'approved', hours_awarded, reviewed_by, reviewed_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/philanthropy')
}

export async function denyHours(id: string, reviewedBy: string) {
  await adminClient().from('philanthropy_hours').update({
    status: 'denied', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/philanthropy')
}
