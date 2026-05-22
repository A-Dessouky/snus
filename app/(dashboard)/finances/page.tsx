import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default async function FinancesPage() {
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
  const isSocialChair = profile.role === 'social_chair'

  const [{ data: transactions }, { data: requests }] = await Promise.all([
    isExec
      ? supabase.from('transactions').select('*').order('date', { ascending: false })
      : { data: [] },
    supabase
      .from('financial_requests')
      .select('*, submitter:profiles!submitted_by(full_name, email)')
      .order('created_at', { ascending: false }),
  ])

  const income = (transactions ?? []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = (transactions ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expenses

  const myRequests = (requests ?? []).filter(r => isSocialChair ? r.submitted_by === profile.id : true)
  const pendingRequests = (requests ?? []).filter(r => r.status === 'pending')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
        <div className="flex gap-2">
          {isSocialChair && (
            <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
              + Request Funds
            </button>
          )}
          {isExec && (
            <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
              + Transaction
            </button>
          )}
        </div>
      </div>

      {/* Balance — exec only */}
      {isExec && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Balance</p>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Income</p>
            <p className="text-2xl font-bold text-green-600 mt-1">${income.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1">${expenses.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Pending fund requests for exec */}
      {isExec && pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pending Requests ({pendingRequests.length})
          </h2>
          {pendingRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <div className="flex justify-between">
                <p className="font-medium text-sm text-gray-900">{req.reason}</p>
                <p className="font-semibold text-sm text-gray-900">${Number(req.amount).toFixed(2)}</p>
              </div>
              {req.submitter && (
                <p className="text-xs text-gray-400">
                  From {(req.submitter as any).full_name ?? (req.submitter as any).email}
                </p>
              )}
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium">
                  Approve
                </button>
                <button className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium">
                  Deny
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Social chair's own requests */}
      {isSocialChair && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">My Requests</h2>
          {myRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{req.reason}</p>
                <p className="text-xs text-gray-400 mt-0.5">${Number(req.amount).toFixed(2)}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                req.status === 'approved' ? 'bg-green-100 text-green-700' :
                req.status === 'denied'   ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
              </span>
            </div>
          ))}
          {!myRequests.length && (
            <div className="text-center py-10 text-gray-400 text-sm">No requests yet.</div>
          )}
        </section>
      )}

      {/* Transaction log for exec */}
      {isExec && (transactions ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Transactions</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Description</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions?.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.date}</td>
                    <td className="px-4 py-3 text-gray-900 flex items-center gap-2">
                      {t.type === 'income'
                        ? <TrendingUp className="w-3 h-3 text-green-500" />
                        : <TrendingDown className="w-3 h-3 text-red-500" />}
                      {t.description}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
