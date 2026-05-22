import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const cookieStore = await cookies()

  // Regular client — used only for the OAuth code exchange
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )

  // Service role client — plain client (no cookies) so it truly bypasses RLS
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('AUTH CALLBACK - user email:', user?.email, 'error:', error?.message)

  if (error || !user?.email) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Check if exec has pre-approved this email
  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .select('id, user_id')
    .eq('email', user.email)
    .single()

  console.log('AUTH CALLBACK - profile found:', profile, 'profileError:', profileError?.message)

  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/no-access', origin))
  }

  // Link auth user to profile on first login, pull name from Google
  if (!profile.user_id) {
    const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        user_id: user.id,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        ...(googleName ? { full_name: googleName } : {}),
      })
      .eq('id', profile.id)
    console.log('AUTH CALLBACK - update error:', updateError?.message)
  }

  return NextResponse.redirect(new URL('/home', origin))
}
