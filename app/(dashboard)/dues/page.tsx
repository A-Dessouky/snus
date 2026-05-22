import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function DuesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/no-access')

  const isExec = profile.role === 'exec'

  const { data: dues } = isExec
    ? await supabase
        .from('dues')
        .select('*, member:profiles!member_id(full_name, email)')
        .order('due_date', { ascending: false })
    : await supabase
        .from('dues')
        .select('*')
        .eq('member_id', profile.id)
        .order('due_date', { ascending: false })

  const unpaid = dues?.filter(d => !d.paid) ?? []
  const paid = dues?.filter(d => d.paid) ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dues</h1>
        {isExec && (
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors">
            + Add Due
          </button>
        )}
      </div>

      {/* Summary cards for exec */}
      {isExec && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{unpaid.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{paid.length}</p>
          </div>
        </div>
      )}

      {/* Unpaid */}
      {unpaid.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Outstanding</h2>
          {unpaid.map(due => (
            <div key={due.id} className="bg-white rounded-xl border border-red-100 shadow-sm p-4 flex items-center gap-4">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                {isExec && due.member && (
                  <p className="font-medium text-sm text-gray-900">
                    {(due.member as any).full_name ?? (due.member as any).email}
                  </p>
                )}
                <p className="text-sm text-gray-600">{due.semester}</p>
                <p className="text-xs text-gray-400">Due {due.due_date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-gray-900">${Number(due.amount).toFixed(2)}</p>
                {isExec && (
                  <button className="text-xs text-yellow-500 hover:text-yellow-600 font-medium mt-1">
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Paid */}
      {paid.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Paid</h2>
          {paid.map(due => (
            <div key={due.id} className="card p-4 flex items-center gap-4 opacity-70">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                {isExec && due.member && (
                  <p className="font-medium text-sm text-gray-900">
                    {(due.member as any).full_name ?? (due.member as any).email}
                  </p>
                )}
                <p className="text-sm text-gray-600">{due.semester}</p>
              </div>
              <p className="font-semibold text-gray-900">${Number(due.amount).toFixed(2)}</p>
            </div>
          ))}
        </section>
      )}

      {!dues?.length && (
        <div className="text-center py-16 text-gray-400 text-sm">No dues records.</div>
      )}
    </div>
  )
}
