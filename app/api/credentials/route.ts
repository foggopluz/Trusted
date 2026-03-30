import { createServiceClient, createServerClient } from '@/lib/supabase-server'
import { credentials as demoCredentials } from '@/lib/store'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (IS_DEMO_MODE) {
    const userId = searchParams.get('userId')
    let result = demoCredentials
    if (userId) result = result.filter(c => c.subjectUserId === userId)
    if (type)   result = result.filter(c => c.credentialType === type)
    return Response.json({ credentials: result })
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServiceClient()
    let query = supabase.from('credentials').select('*').eq('user_id', user.id)
    if (type) query = query.eq('type', type)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ credentials: data ?? [] })
  } catch {
    return Response.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, description, issuer_name, issuer_type, document_url } = body

    if (!type) return Response.json({ error: 'type is required' }, { status: 400 })

    if (IS_DEMO_MODE) {
      const newCredential = {
        id: `cred-${Date.now()}`,
        user_id: 'demo', type, title: title ?? null,
        description: description ?? null,
        issuer_name: issuer_name ?? null,
        issuer_type: issuer_type ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
      return Response.json({ credential: newCredential }, { status: 201 })
    }

    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('credentials')
      .insert({ user_id: user.id, type, title, description, issuer_name, issuer_type, document_url, status: 'pending' })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ credential: data }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create credential' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body
    if (!id || !status) return Response.json({ error: 'id and status required' }, { status: 400 })
    if (IS_DEMO_MODE)   return Response.json({ ok: true })

    const supabase = createServiceClient()
    const { error } = await supabase.from('credentials').update({ status }).eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update credential' }, { status: 500 })
  }
}
