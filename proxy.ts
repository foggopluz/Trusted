import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PROTECTED_PATHS = ['/dashboard', '/business/dashboard', '/profile/edit']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Read the Supabase session cookie
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  // If no tokens present, redirect to login
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      // Try refreshing the session if we have a refresh token
      if (refreshToken) {
        const { data, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
        if (refreshError || !data.session) {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('next', pathname)
          return NextResponse.redirect(loginUrl)
        }
        // Session refreshed — allow through
        return NextResponse.next()
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // On any error allow through — client-side will handle the guard
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/business/dashboard/:path*', '/profile/edit/:path*'],
}
