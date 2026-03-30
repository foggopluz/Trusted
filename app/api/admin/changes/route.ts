import { changeRequests, users } from '@/lib/store'
import { createServerClient } from '@/lib/supabase-server'
import { audit } from '@/lib/audit'

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const caller = users.find(u => u.id === user?.id)
    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action } = body

    if (!id || !action) return Response.json({ error: 'id and action are required' }, { status: 400 })
    if (!['approved', 'rejected'].includes(action)) {
      return Response.json({ error: 'action must be approved or rejected' }, { status: 400 })
    }

    const cr = changeRequests.find(c => c.id === id)
    if (!cr) return Response.json({ error: 'Change request not found' }, { status: 404 })

    cr.status     = action
    cr.resolvedAt = new Date().toISOString().split('T')[0]
    cr.resolvedBy = caller.id

    audit({ actorId: caller.id, action: `admin.change_request.${action}`, targetType: 'change_request', targetId: id, metadata: { field: cr.field } }).catch(() => {})
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to process change request' }, { status: 500 })
  }
}
