import { pendingVerifications, users, companies } from '@/lib/store'
import { createServerClient } from '@/lib/supabase-server'
import { sendVerificationApproved, sendVerificationRejected } from '@/lib/email'

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

    // Find the subject's email for notification
    let subjectEmail: string | undefined
    let subjectName = v.name
    if (v.type === 'individual') {
      const subject = users.find(u => u.fullName === v.name)
      if (subject) {
        subject.idVerificationStatus = action === 'approved' ? 'verified' : 'rejected'
        subjectEmail = subject.email
      }
    } else {
      const company = companies.find(c => c.businessName === v.name)
      if (company) {
        if (action === 'approved') company.verificationStatus = 'verified'
        const owner = users.find(u => u.id === company.ownerUserId)
        subjectEmail = owner?.email
      }
    }

    // Remove from pending queue regardless of decision
    pendingVerifications.splice(idx, 1)

    // Fire-and-forget email notification
    if (subjectEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://trustnet.app'
      if (action === 'approved') {
        sendVerificationApproved({ toEmail: subjectEmail, toName: subjectName, dashboardUrl: `${baseUrl}/dashboard` }).catch(() => {})
      } else {
        sendVerificationRejected({ toEmail: subjectEmail, toName: subjectName, note, dashboardUrl: `${baseUrl}/dashboard` }).catch(() => {})
      }
    }

    return Response.json({ ok: true, action, note: note ?? null })
  } catch {
    return Response.json({ error: 'Failed to process verification' }, { status: 500 })
  }
}
