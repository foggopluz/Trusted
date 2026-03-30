import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { users } from '@/lib/store'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// In-memory disputes for demo mode
const demoDisputes: {
  id: string; credentialId: string; filedBy: string; reason: string
  evidenceUrl?: string; status: string; resolutionNote?: string
  resolvedBy?: string; resolvedAt?: string; createdAt: string
}[] = []

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const credentialId = searchParams.get('credentialId')
  const userId       = searchParams.get('userId')
  const all          = searchParams.get('all') // admin: fetch all open disputes

  if (IS_DEMO_MODE) {
    let result = demoDisputes
    if (credentialId) result = result.filter(d => d.credentialId === credentialId)
    if (userId)       result = result.filter(d => d.filedBy === userId)
    if (!all)         result = result.filter(d => d.status === 'open')
    return Response.json({ disputes: result })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()
    let query = serviceClient.from('disputes').select('*').order('created_at', { ascending: false })

    // Admin can fetch all; regular users only see their own
    const profile = users.find(u => u.id === user.id)
    const isAdmin = profile?.role === 'admin'

    if (!isAdmin) {
      query = query.eq('filed_by', user.id)
    }
    if (credentialId) query = query.eq('credential_id', credentialId)
    if (!all)         query = query.eq('status', 'open')

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ disputes: data ?? [] })
  } catch {
    return Response.json({ error: 'Failed to fetch disputes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: { credentialId?: string; reason?: string; evidenceUrl?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { credentialId, reason, evidenceUrl } = body
  if (!credentialId || !reason?.trim()) {
    return Response.json({ error: 'credentialId and reason are required' }, { status: 400 })
  }

  if (IS_DEMO_MODE) {
    const dispute = {
      id: `dispute-${Date.now()}`,
      credentialId,
      filedBy: 'u-1',
      reason: reason.trim(),
      evidenceUrl,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    demoDisputes.push(dispute)
    return Response.json({ dispute }, { status: 201 })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Verify the credential belongs to the filing user
    const { data: cred } = await serviceClient
      .from('credentials')
      .select('user_id')
      .eq('id', credentialId)
      .single()
    if (!cred || cred.user_id !== user.id) {
      return Response.json({ error: 'You can only dispute your own credentials' }, { status: 403 })
    }

    // Prevent duplicate open disputes on same credential
    const { data: existing } = await serviceClient
      .from('disputes')
      .select('id')
      .eq('credential_id', credentialId)
      .eq('filed_by', user.id)
      .eq('status', 'open')
      .maybeSingle()
    if (existing) {
      return Response.json({ error: 'An open dispute already exists for this credential' }, { status: 409 })
    }

    const { data, error } = await serviceClient
      .from('disputes')
      .insert({
        credential_id: credentialId,
        filed_by:      user.id,
        reason:        reason.trim(),
        evidence_url:  evidenceUrl ?? null,
        status:        'open',
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ dispute: data }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to file dispute' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  let body: { id?: string; action?: string; resolutionNote?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, action, resolutionNote } = body
  if (!id || !action) return Response.json({ error: 'id and action are required' }, { status: 400 })
  if (!['resolved', 'dismissed'].includes(action)) {
    return Response.json({ error: 'action must be resolved or dismissed' }, { status: 400 })
  }

  if (IS_DEMO_MODE) {
    const dispute = demoDisputes.find(d => d.id === id)
    if (!dispute) return Response.json({ error: 'Dispute not found' }, { status: 404 })
    dispute.status         = action
    dispute.resolutionNote = resolutionNote
    dispute.resolvedAt     = new Date().toISOString()
    return Response.json({ ok: true })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Admin only
    const { data: profile } = await serviceClient
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await serviceClient
      .from('disputes')
      .update({
        status:          action,
        resolution_note: resolutionNote ?? null,
        resolved_by:     user.id,
        resolved_at:     new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update dispute' }, { status: 500 })
  }
}
