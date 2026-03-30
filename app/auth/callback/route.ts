import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const safeNext = next?.startsWith('/') ? next : '/dashboard'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
