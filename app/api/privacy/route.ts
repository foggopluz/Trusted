// GET  /api/privacy — get current user's privacy settings
// PUT  /api/privacy — update privacy settings (partial update supported)

import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { DEFAULT_PRIVACY, validatePrivacySettings } from '@/lib/privacy'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ privacy: DEFAULT_PRIVACY })

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .select('privacy_settings')
    .eq('id', user.id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const settings = { ...DEFAULT_PRIVACY, ...(data?.privacy_settings as object ?? {}) }
  return Response.json({ privacy: settings })
}

export async function PUT(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ ok: true, privacy: DEFAULT_PRIVACY })

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = validatePrivacySettings(body)
  if (!result.valid) return Response.json({ error: result.error }, { status: 400 })

  const serviceClient = createServiceClient()

  // Merge with existing settings so partial updates don't wipe unset fields
  const { data: existing } = await serviceClient
    .from('profiles')
    .select('privacy_settings')
    .eq('id', user.id)
    .single()

  const merged = {
    ...DEFAULT_PRIVACY,
    ...(existing?.privacy_settings as object ?? {}),
    ...result.settings,
  }

  const { error } = await serviceClient
    .from('profiles')
    .update({ privacy_settings: merged })
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, privacy: merged })
}
