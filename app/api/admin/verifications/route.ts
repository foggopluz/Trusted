import { pendingVerifications, users, companies } from '@/lib/store'
import { createServerClient } from '@/lib/supabase-server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const caller = users.find(u => u.id === user?.id)
    if (!caller || caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, note } = body

    if (!id || !action) return Response.json({ error: 'id and action are required' }, { status: 400 })
    if (!['approved', 'rejected'].includes(action)) {
      return Response.json({ error: 'action must be approved or rejected' }, { status: 400 })
    }

    const idx = pendingVerifications.findIndex(v => v.id === id)
    if (idx === -1) return Response.json({ error: 'Verification not found' }, { status: 404 })

    const v = pendingVerifications[idx]

    if (action === 'approved') {
      if (v.type === 'individual') {
        const user = users.find(u => u.fullName === v.name)
        if (user) user.idVerificationStatus = 'verified'
      } else {
        const company = companies.find(c => c.businessName === v.name)
        if (company) company.verificationStatus = 'verified'
      }
    }

    // Remove from pending queue regardless of decision
    pendingVerifications.splice(idx, 1)

    return Response.json({ ok: true, action, note: note ?? null })
  } catch {
    return Response.json({ error: 'Failed to process verification' }, { status: 500 })
  }
}
