import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Download } from 'lucide-react'

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: documents }] = await Promise.all([
    supabase.from('profiles').select('role').eq('user_id', user.id).single(),
    supabase
      .from('documents')
      .select('*, uploader:profiles!uploaded_by(full_name, email)')
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/no-access')

  const isExec = profile.role === 'exec'

  const categories = [...new Set(documents?.map(d => d.category ?? 'General'))] as string[]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chapter Documents</h1>
        {isExec && (
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors">
            + Upload
          </button>
        )}
      </div>

      {categories.length > 0 ? categories.map(cat => {
        const catDocs = documents?.filter(d => (d.category ?? 'General') === cat) ?? []
        return (
          <section key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{cat}</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
              {catDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 px-4 py-3">
                  <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400">
                      {doc.file_name}
                      {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
                    </p>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-yellow-500 transition-colors rounded-lg hover:bg-yellow-50"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )
      }) : (
        <div className="text-center py-16 text-gray-400 text-sm">No documents uploaded yet.</div>
      )}
    </div>
  )
}
