import { changeRequests, users } from '@/lib/store'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET() {
  if (IS_DEMO_MODE) {
    return Response.json({ changeRequests })
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Change requests are still in demo mode only — return empty for now
  return Response.json({ changeRequests: [] })
}

export async function PATCH(request: Request) {
  try {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, action } = body
    if (!id || !action) return Response.json({ error: 'id and action are required' }, { status: 400 })
    if (!['approved', 'rejected'].includes(action)) {
      return Response.json({ error: 'action must be approved or rejected' }, { status: 400 })
    }

    if (IS_DEMO_MODE) {
      const caller = users.find(u => u.id === user.id)
      if (!caller || caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })
      const cr = changeRequests.find(c => c.id === id)
      if (!cr) return Response.json({ error: 'Change request not found' }, { status: 404 })
      cr.status = action
      cr.resolvedAt = new Date().toISOString().split('T')[0]
      cr.resolvedBy = caller.id
      audit({ actorId: caller.id, action: `admin.change_request.${action}`, targetType: 'change_request', targetId: id, metadata: { field: cr.field } }).catch(() => {})
      return Response.json({ ok: true })
    }

    const serviceClient = createServiceClient()
    const { data: callerProfile } = await serviceClient.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

    audit({ actorId: user.id, action: `admin.change_request.${action}`, targetType: 'change_request', targetId: id, metadata: {} }).catch(() => {})
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to process change request' }, { status: 500 })
  }
}
