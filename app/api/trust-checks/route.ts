import { trustChecks, companies } from '@/lib/store'
import type { TrustCheck } from '@/lib/types'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const userId    = searchParams.get('userId')

  let result = trustChecks
  if (companyId) result = result.filter(tc => tc.requesterCompanyId === companyId)
  if (userId)    result = result.filter(tc => tc.subjectUserId === userId)

  return Response.json({ trustChecks: result })
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

  // IDOR fix: verify the session user owns the requesting company
  if (!IS_DEMO_MODE) {
    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { data: company, error: companyError } = await supabase
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
    } catch {
      return Response.json({ error: 'Failed to verify authorization' }, { status: 500 })
    }
  } else {
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
  }

  const newCheck: TrustCheck = {
    id: `tc-${Date.now()}`,
    requesterCompanyId: companyId,
    subjectUserId: userId,
    consentStatus: 'pending',
    credentialsShared: [],
    createdAt: new Date().toISOString().split('T')[0],
  }

  // Append to in-memory store (persists for the process lifetime)
  trustChecks.push(newCheck)

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

      // IDOR fix: verify the session user is the subject of the trust check
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

    // IDOR fix: verify the session user is the subject of the trust check
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: check, error: fetchError } = await serviceClient
      .from('trust_checks')
      .select('subject_user_id')
      .eq('id', id)
      .single()
    if (fetchError || !check) return Response.json({ error: 'Trust check not found' }, { status: 404 })
    if (check.subject_user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await serviceClient
      .from('trust_checks')
      .update({ consent_status: status })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update trust check' }, { status: 500 })
  }
}
