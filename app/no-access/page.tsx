import Link from 'next/link'

export default function NoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="w-full max-w-sm text-center px-8 py-10 bg-white rounded-2xl shadow-xl space-y-6">
        <div className="text-5xl font-bold text-yellow-500">Σ</div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your Google account is not registered in the chapter system. Contact your Exec to be added.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm text-yellow-500 hover:text-yellow-600 font-medium"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
