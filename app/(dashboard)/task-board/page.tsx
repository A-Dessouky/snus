import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddTaskModal } from './add-task-modal'
import { MarkCompleteButton } from './mark-complete-button'
import type { TaskStatus } from '@/lib/types'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending',     label: 'To Do',       color: 'bg-gray-100 text-gray-600' },
  { status: 'in_progress', label: 'In Progress',  color: 'bg-blue-100 text-blue-700' },
  { status: 'complete',    label: 'Complete',     color: 'bg-green-100 text-green-700' },
]

export default async function TaskBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: tasks }, { data: members }] = await Promise.all([
    supabase.from('profiles').select('id, role').eq('user_id', user.id).single(),
    supabase.from('tasks').select('*, assignee:profiles!assigned_to(full_name, email)').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email').order('full_name'),
  ])

  if (!profile) redirect('/no-access')

  const canCreate = ['exec', 'social_chair'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        {canCreate && <AddTaskModal profileId={profile.id} members={members ?? []} />}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map(col => {
          const colTasks = tasks?.filter(t => t.status === col.status) ?? []
          return (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${col.color}`}>{col.label}</span>
                <span className="text-xs text-gray-400">{colTasks.length}</span>
              </div>
              {colTasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
                  <p className="font-medium text-sm text-gray-900">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center justify-between">
                    {task.assignee && (
                      <span className="text-xs text-gray-400">
                        {(task.assignee as any).full_name ?? (task.assignee as any).email}
                      </span>
                    )}
                    {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                  </div>
                  {task.assigned_to === profile.id && task.status !== 'complete' && (
                    <MarkCompleteButton taskId={task.id} />
                  )}
                </div>
              ))}
              {!colTasks.length && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                  No tasks
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
