'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function addMember(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = formData.get('role') as string
  const full_name = (formData.get('full_name') as string).trim() || null

  if (!email || !role) return { error: 'Email and role are required.' }

  // Check if already exists
  const { data: existing } = await adminClient()
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) return { error: 'A member with that email already exists.' }

  const { error } = await adminClient()
    .from('profiles')
    .insert({ email, role, full_name })

  if (error) return { error: error.message }

  revalidatePath('/member-management')
  return { success: true }
}

export async function removeMember(id: string) {
  // Also delete their auth user if they have one
  const { data: profile } = await adminClient()
    .from('profiles')
    .select('user_id')
    .eq('id', id)
    .single()

  if (profile?.user_id) {
    await adminClient().auth.admin.deleteUser(profile.user_id)
  }

  await adminClient().from('profiles').delete().eq('id', id)
  revalidatePath('/member-management')
}

export async function updateMemberRole(id: string, role: string) {
  await adminClient().from('profiles').update({ role }).eq('id', id)
  revalidatePath('/member-management')
}
