import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!user && !isPublic && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/' || isPublic)) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const role = profile?.role
    return NextResponse.redirect(new URL(role === 'dentist' ? '/dentist/dashboard' : '/patient/dashboard', request.url))
  }

  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const role = profile?.role
    if (role === 'patient' && pathname.startsWith('/dentist')) {
      return NextResponse.redirect(new URL('/patient/dashboard', request.url))
    }
    if (role === 'dentist' && pathname.startsWith('/patient')) {
      return NextResponse.redirect(new URL('/dentist/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
