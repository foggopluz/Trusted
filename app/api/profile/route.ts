import { createServerClient } from '@/lib/supabase-server'
import type { ProfileRow } from '@/lib/supabase'
import { applyPrivacyFilter, DEFAULT_PRIVACY, ViewerContext } from '@/lib/privacy'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const MUTABLE_FIELDS = new Set([
  'full_name',
  'phone',
  'city',
  'profession',
  'bio',
  'account_type',
  'country',
])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
  if (IS_DEMO_MODE) return Response.json({ profile: null })

  try {
    // Use the session-aware anon client — profiles_select_all USING (true) allows public reads
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    const { data: rawData, error } = await authClient.from('profiles').select('*').eq('id', userId).single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    const data = rawData as ProfileRow | null

    // Fetch the caller's role — same policy allows this read
    const { data: callerProfile } = user
      ? await authClient.from('profiles').select('role').eq('id', user.id).single()
      : { data: null }

    const viewer: ViewerContext = {
      isOwner:    user?.id === userId,
      isAdmin:    callerProfile?.role === 'admin',
      isVerified: !!user,
    }

    if (!data) return Response.json({ profile: null })
    const filtered = applyPrivacyFilter(data as Record<string, unknown>, data.privacy_settings ?? DEFAULT_PRIVACY, viewer)
    return Response.json({ profile: filtered })
  } catch {
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, ...rawUpdates } = body
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
    if (IS_DEMO_MODE) return Response.json({ ok: true })

    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || user.id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    for (const key of Object.keys(rawUpdates)) {
      if (!MUTABLE_FIELDS.has(key)) {
        return Response.json(
          { error: `Field "${key}" cannot be modified` },
          { status: 400 },
        )
      }
      updates[key] = rawUpdates[key]
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await authClient.from('profiles').update(updates).eq('id', userId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
