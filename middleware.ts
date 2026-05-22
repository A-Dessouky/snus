import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/no-access']
const EXEC_ONLY = ['/member-management', '/finances']
const EXEC_OR_SOCIAL = ['/finances']
const EXEC_OR_RUSH = ['/rush-database']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isAuthCallback = pathname.startsWith('/auth/')

  if (isAuthCallback) return supabaseResponse

  if (!user) {
    if (isPublic) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (!isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/no-access', request.url))
    }

    const role = profile.role as string

    if (pathname.startsWith('/member-management') && role !== 'exec') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    if (pathname.startsWith('/finances') && role !== 'exec' && role !== 'social_chair') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    if (pathname.startsWith('/rush-database') && role !== 'exec' && role !== 'rush_chair') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
