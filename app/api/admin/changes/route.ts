import { changeRequests } from '@/lib/store'

export async function PATCH(request: Request) {
  try {
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
    cr.resolvedBy = 'u-admin'

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to process change request' }, { status: 500 })
  }
}
