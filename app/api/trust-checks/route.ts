import { trustChecks } from '@/lib/store'
import type { TrustCheck } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase-server'

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
  try {
    const body = await request.json()
    const { id, status } = body
    if (!id || !status) return Response.json({ error: 'id and status are required' }, { status: 400 })
    if (!['granted', 'denied'].includes(status)) {
      return Response.json({ error: 'status must be granted or denied' }, { status: 400 })
    }

    if (IS_DEMO_MODE) {
      const check = trustChecks.find(tc => tc.id === id)
      if (!check) return Response.json({ error: 'Trust check not found' }, { status: 404 })
      check.consentStatus = status as 'granted' | 'denied'
      return Response.json({ ok: true })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('trust_checks')
      .update({ consent_status: status })
      .eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to update trust check' }, { status: 500 })
  }
}
