'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function submitPointRequest(formData: FormData) {
  const member_id = formData.get('member_id') as string
  const description = formData.get('description') as string
  const points_requested = parseInt(formData.get('points_requested') as string) || 0

  if (!description.trim()) return

  await adminClient().from('house_point_requests').insert({
    member_id,
    description,
    points_requested,
    status: 'pending',
  })

  revalidatePath('/house-points')
}

export async function approvePointRequest(formData: FormData) {
  const id = formData.get('id') as string
  const points_awarded = parseInt(formData.get('points_awarded') as string) || 0
  const reviewed_by = formData.get('reviewed_by') as string

  await adminClient().from('house_point_requests').update({
    status: 'approved',
    points_awarded,
    reviewed_by,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)

  revalidatePath('/house-points')
}

export async function denyPointRequest(id: string, reviewedBy: string) {
  await adminClient().from('house_point_requests').update({
    status: 'denied',
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)

  revalidatePath('/house-points')
}
