// middleware.ts
// Route protection middleware using Supabase Auth
// Runs on every request to check authentication status and redirect accordingly

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
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

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Public routes (no auth required) ──────────────────────────────────────
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // ── If not logged in and accessing protected route → redirect to login ─────
  if (!user && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── If logged in and accessing root → fetch role and redirect ─────────────
  if (user && (pathname === '/' || isPublicRoute)) {
    // Get user role from database
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (role === 'dentist') {
      return NextResponse.redirect(new URL('/dentist/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/patient/dashboard', request.url))
    }
  }

  // ── Role-based route protection ───────────────────────────────────────────
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Patient trying to access dentist routes
    if (role === 'patient' && pathname.startsWith('/dentist')) {
      return NextResponse.redirect(new URL('/patient/dashboard', request.url))
    }

    // Dentist trying to access patient routes
    if (role === 'dentist' && pathname.startsWith('/patient')) {
      return NextResponse.redirect(new URL('/dentist/dashboard', request.url))
    }
  }

  return response
}

// Define which routes the middleware applies to
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
