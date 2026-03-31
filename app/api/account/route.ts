import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: NextRequest) {
  if (IS_DEMO_MODE) {
    return NextResponse.json(
      { profile: null, credentials: [], trust_checks: [], disputes: [], api_keys: [] },
      { headers: { 'Content-Disposition': 'attachment; filename="trustnet-export.json"' } },
    )
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const serviceClient = createServiceClient()

    const [
      { data: profile },
      { data: credentials },
      { data: trustChecks },
      { data: disputes },
      { data: apiKeys },
    ] = await Promise.all([
      serviceClient.from('profiles').select('*').eq('id', user.id).single(),
      serviceClient.from('credentials').select('*').eq('user_id', user.id),
      serviceClient.from('trust_checks').select('*').eq('subject_id', user.id),
      serviceClient.from('disputes').select('*').eq('filed_by', user.id),
      serviceClient.from('api_keys').select('id, name, created_at').eq('owner_id', user.id),
    ])

    const payload = {
      profile:      profile ?? null,
      credentials:  credentials ?? [],
      trust_checks: trustChecks ?? [],
      disputes:     disputes ?? [],
      api_keys:     apiKeys ?? [],
    }

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="trustnet-export.json"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export account data' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (IS_DEMO_MODE) {
    return NextResponse.json({ message: 'Account deleted' })
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const serviceClient = createServiceClient()

    // Delete all user-owned data before removing the profile and auth record
    await Promise.all([
      serviceClient.from('disputes').delete().eq('filed_by', user.id),
      serviceClient.from('trust_checks').delete().eq('subject_id', user.id),
      serviceClient.from('api_keys').delete().eq('owner_id', user.id),
      serviceClient.from('team_members').delete().eq('user_id', user.id),
      serviceClient.from('webhooks').delete().eq('owner_id', user.id),
    ])

    await serviceClient.from('credentials').delete().eq('user_id', user.id)
    await serviceClient.from('profiles').delete().eq('id', user.id)

    // Remove auth user — Supabase JS v2 service-role client exposes admin.deleteUser
    await serviceClient.auth.admin.deleteUser(user.id)

    return NextResponse.json({ message: 'Account deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
