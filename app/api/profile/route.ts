import { createServiceClient, createServerClient } from '@/lib/supabase-server'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
  if (IS_DEMO_MODE) return Response.json({ profile: null })

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ profile: data })
  } catch {
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, ...updates } = body
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
    if (IS_DEMO_MODE) return Response.json({ ok: true })

    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || user.id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
