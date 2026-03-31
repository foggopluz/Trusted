import { pendingVerifications, users, companies } from '@/lib/store'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { sendVerificationApproved, sendVerificationRejected } from '@/lib/email'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET() {
  if (IS_DEMO_MODE) {
    return Response.json({ verifications: pendingVerifications })
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await serviceClient
    .from('profiles')
    .select('id, full_name, email, id_verification_status, id_number, verification_method, document_url, created_at')
    .eq('id_verification_status', 'pending')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ verifications: data ?? [] })
}

export async function PATCH(request: Request) {
  try {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, action, note } = body
    if (!id || !action) return Response.json({ error: 'id and action are required' }, { status: 400 })
    if (!['approved', 'rejected'].includes(action)) {
      return Response.json({ error: 'action must be approved or rejected' }, { status: 400 })
    }

    if (IS_DEMO_MODE) {
      const caller = users.find(u => u.id === user.id)
      if (!caller || caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

      const idx = pendingVerifications.findIndex(v => v.id === id)
      if (idx === -1) return Response.json({ error: 'Verification not found' }, { status: 404 })
      const v = pendingVerifications[idx]
      if (v.type === 'individual') {
        const subject = users.find(u => u.fullName === v.name)
        if (subject) subject.idVerificationStatus = action === 'approved' ? 'verified' : 'rejected'
      } else {
        const company = companies.find(c => c.businessName === v.name)
        if (company && action === 'approved') company.verificationStatus = 'verified'
      }
      pendingVerifications.splice(idx, 1)
      return Response.json({ ok: true, action, note: note ?? null })
    }

    const serviceClient = createServiceClient()
    const { data: callerProfile } = await serviceClient.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

    const newStatus = action === 'approved' ? 'verified' : 'rejected'
    const { data: subject, error: fetchError } = await serviceClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', id)
      .single()
    if (fetchError || !subject) return Response.json({ error: 'Profile not found' }, { status: 404 })

    const { error } = await serviceClient
      .from('profiles')
      .update({ id_verification_status: newStatus })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://trustnet.app'
    if (subject.email) {
      if (action === 'approved') {
        sendVerificationApproved({ toEmail: subject.email, toName: subject.full_name, dashboardUrl: `${baseUrl}/dashboard` }).catch(() => {})
      } else {
        sendVerificationRejected({ toEmail: subject.email, toName: subject.full_name, note, dashboardUrl: `${baseUrl}/dashboard` }).catch(() => {})
      }
    }

    audit({ actorId: user.id, action: `admin.verify.${action}`, targetType: 'profile', targetId: id, metadata: { note: note ?? null } }).catch(() => {})
    return Response.json({ ok: true, action, note: note ?? null })
  } catch {
    return Response.json({ error: 'Failed to process verification' }, { status: 500 })
  }
}
