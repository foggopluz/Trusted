import { trustChecks, companies, users } from '@/lib/store'
import type { TrustCheck } from '@/lib/types'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { sendTrustCheckRequest } from '@/lib/email'
import { audit } from '@/lib/audit'
import { fireWebhookEvent } from '@/lib/webhooks'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// Map a Supabase DB row to the TrustCheck type
function rowToTrustCheck(row: Record<string, unknown>): TrustCheck {
  return {
    id:                 row.id as string,
    requesterCompanyId: row.requester_company_id as string,
    subjectUserId:      row.subject_id as string,
    consentStatus:      row.consent_status as TrustCheck['consentStatus'],
    scoreAtCheck:       row.score_at_check as number | undefined,
    riskTier:           row.risk_tier as TrustCheck['riskTier'] | undefined,
    credentialsShared:  (row.credentials_shared as string[]) ?? [],
    createdAt:          (row.created_at as string).split('T')[0],
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const userId    = searchParams.get('userId')

  if (IS_DEMO_MODE) {
    let result = trustChecks
    if (companyId) result = result.filter(tc => tc.requesterCompanyId === companyId)
    if (userId)    result = result.filter(tc => tc.subjectUserId === userId)
    return Response.json({ trustChecks: result })
  }

  try {
    if (!companyId && !userId) {
      return Response.json({ error: 'At least one of companyId or userId is required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    if (companyId) {
      const { data: company, error: companyError } = await serviceClient
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .single()
      if (companyError || !company) {
        return Response.json({ error: 'Company not found' }, { status: 404 })
      }
      if (company.owner_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (userId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = serviceClient.from('trust_checks').select('*')
    if (companyId) query = query.eq('requester_company_id', companyId)
    if (userId)    query = query.eq('subject_id', userId)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ trustChecks: (data ?? []).map(rowToTrustCheck) })
  } catch {
    return Response.json({ error: 'Failed to fetch trust checks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: { companyId?: string; userId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { companyId, userId } = body

  if (!companyId || !userId) {
    return Response.json(
      { error: 'Both companyId and userId are required' },
      { status: 400 }
    )
  }

  if (!IS_DEMO_MODE) {
    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const serviceClient = createServiceClient()

      // Verify session user owns the requesting company
      const { data: company, error: companyError } = await serviceClient
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .single()
      if (companyError || !company) {
        return Response.json({ error: 'Company not found' }, { status: 404 })
      }
      if (company.owner_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Prevent duplicate pending checks
      const { data: existing } = await serviceClient
        .from('trust_checks')
        .select('id, consent_status')
        .eq('requester_company_id', companyId)
        .eq('subject_id', userId)
        .eq('consent_status', 'pending')
        .maybeSingle()
      if (existing) {
        return Response.json({ error: 'A pending trust check already exists for this user' }, { status: 409 })
      }

      // Enforce plan check limit before inserting
      const { data: checkLimit } = await serviceClient
        .from('companies')
        .select('checks_remaining, checks_used')
        .eq('id', companyId)
        .single()
      if (!checkLimit || checkLimit.checks_remaining <= 0) {
        return Response.json({ error: 'Check limit reached for your plan. Please upgrade to continue.' }, { status: 402 })
      }

      const { data: inserted, error: insertError } = await serviceClient
        .from('trust_checks')
        .insert({
          requester_id:         user.id,
          subject_id:           userId,
          requester_company_id: companyId,
          consent_status:       'pending',
          credentials_shared:   [],
        })
        .select()
        .single()

      if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

      // Notify subject
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://trustnet.app'
      const { data: subjectProfile } = await serviceClient.from('profiles').select('full_name, email').eq('id', userId).single()
      const { data: companyRow } = await serviceClient.from('companies').select('business_name').eq('id', companyId).single()
      if (subjectProfile?.email) {
        sendTrustCheckRequest({
          toEmail: subjectProfile.email,
          toName: subjectProfile.full_name,
          businessName: companyRow?.business_name ?? 'A business',
          dashboardUrl: `${baseUrl}/dashboard`,
        }).catch(() => {})
      }

      // Audit log
      audit({ actorId: user.id, action: 'trust_check.create', targetType: 'trust_check', targetId: inserted.id, metadata: { companyId, subjectUserId: userId } }).catch(() => {})

      // Decrement checks_remaining, increment checks_used
      await serviceClient
        .from('companies')
        .update({
          checks_remaining: (checkLimit?.checks_remaining ?? 1) - 1,
          checks_used:      (checkLimit?.checks_used ?? 0) + 1,
        })
        .eq('id', companyId)

      return Response.json({ trustCheck: rowToTrustCheck(inserted) }, { status: 201 })
    } catch {
      return Response.json({ error: 'Failed to create trust check' }, { status: 500 })
    }
  }

  // Demo mode: verify against in-memory store
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const company = companies.find(c => c.id === companyId)
  if (!company) {
    return Response.json({ error: 'Company not found' }, { status: 404 })
  }
  if (company.ownerUserId !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (company.checksRemaining <= 0) {
    return Response.json({ error: 'Check limit reached for your plan. Please upgrade to continue.' }, { status: 402 })
  }

  const newCheck: TrustCheck = {
    id: `tc-${Date.now()}`,
    requesterCompanyId: companyId,
    subjectUserId: userId,
    consentStatus: 'pending',
    credentialsShared: [],
    createdAt: new Date().toISOString().split('T')[0],
  }
  trustChecks.push(newCheck)
  company.checksRemaining -= 1
  company.checksUsed      += 1
  return Response.json({ trustCheck: newCheck }, { status: 201 })
}

export async function PATCH(request: Request) {
  let body: { id?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, status } = body
  if (!id || !status) return Response.json({ error: 'id and status are required' }, { status: 400 })
  if (!['granted', 'denied'].includes(status)) {
    return Response.json({ error: 'status must be granted or denied' }, { status: 400 })
  }

  try {
    if (IS_DEMO_MODE) {
      const check = trustChecks.find(tc => tc.id === id)
      if (!check) return Response.json({ error: 'Trust check not found' }, { status: 404 })

      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (check.subjectUserId !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }

      check.consentStatus = status as 'granted' | 'denied'
      return Response.json({ ok: true })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: check, error: fetchError } = await serviceClient
      .from('trust_checks')
      .select('subject_id')
      .eq('id', id)
      .single()
    if (fetchError || !check) return Response.json({ error: 'Trust check not found' }, { status: 404 })
    if (check.subject_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await serviceClient
      .from('trust_checks')
      .update({ consent_status: status })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    audit({ actorId: user.id, action: `trust_check.${status}`, targetType: 'trust_check', targetId: id }).catch(() => {})
    fireWebhookEvent(
      status === 'granted' ? 'trust_check.granted' : 'trust_check.denied',
      { trustCheckId: id, subjectUserId: user.id },
    ).catch(() => {})
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update trust check' }, { status: 500 })
  }
}
