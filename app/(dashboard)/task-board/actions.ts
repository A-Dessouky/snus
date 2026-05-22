'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const assigned_to = formData.get('assigned_to') as string
  const due_date = formData.get('due_date') as string
  const created_by = formData.get('created_by') as string

  if (!title.trim()) return

  await adminClient().from('tasks').insert({
    title,
    description: description || null,
    assigned_to: assigned_to || null,
    due_date: due_date || null,
    created_by,
    status: 'pending',
  })

  revalidatePath('/task-board')
}

export async function markTaskComplete(taskId: string) {
  await adminClient().from('tasks').update({ status: 'complete' }).eq('id', taskId)
  revalidatePath('/task-board')
}
