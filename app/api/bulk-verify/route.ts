// POST /api/bulk-verify — bulk score lookup for a list of users (businesses only)
//
// Accepts JSON body: { userIds: string[] }  (max 100 per request)
// Or multipart/form-data with a CSV file containing a `userId` column.
//
// Returns per-user score results plus a summary.
// Each lookup counts against the company's checks_remaining balance.
// Requires API key auth or session auth as a business owner.

import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { validateApiKey } from '@/lib/api-auth'
import { computeScore, getScoreLabel } from '@/lib/scoring'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const MAX_BATCH = 100

interface BulkResult {
  userId:  string
  status:  'ok' | 'not_found' | 'error'
  score?:  number
  label?:  string
  tier?:   string
  error?:  string
}

// Parse CSV text and extract userId column (case-insensitive header)
function parseUserIdsFromCsv(csv: string): string[] {
  const lines = csv.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const col = headers.indexOf('userid')
  if (col === -1) return []

  return lines
    .slice(1)
    .map(line => line.split(',')[col]?.trim() ?? '')
    .filter(id => id.length > 0)
}

async function resolveCompanyId(request: Request): Promise<{ companyId: string; actorId: string } | null> {
  if (IS_DEMO_MODE) return { companyId: 'demo', actorId: 'demo' }

  const apiCompanyId = await validateApiKey(request)
  if (apiCompanyId) return { companyId: apiCompanyId, actorId: apiCompanyId }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data } = await serviceClient.from('companies').select('id').eq('owner_id', user.id).single()
  if (!data) return null
  return { companyId: data.id, actorId: user.id }
}

export async function POST(request: Request) {
  const context = await resolveCompanyId(request)
  if (!context) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { companyId, actorId } = context
  let userIds: string[] = []

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    let form: FormData
    try { form = await request.formData() } catch {
      return Response.json({ error: 'Could not parse form data' }, { status: 400 })
    }
    const file = form.get('file') as File | null
    if (!file) return Response.json({ error: 'file field is required' }, { status: 400 })

    const text = await file.text()
    userIds = parseUserIdsFromCsv(text)
    if (userIds.length === 0) {
      return Response.json({
        error: 'CSV must have a "userId" column header and at least one data row',
      }, { status: 400 })
    }
  } else {
    let body: Record<string, unknown>
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
      return Response.json({ error: 'userIds must be a non-empty array' }, { status: 400 })
    }
    userIds = (body.userIds as string[]).filter(id => typeof id === 'string' && id.trim().length > 0)
  }

  if (userIds.length > MAX_BATCH) {
    return Response.json({ error: `Maximum ${MAX_BATCH} users per request` }, { status: 422 })
  }

  // Demo mode: synthetic scores
  if (IS_DEMO_MODE) {
    const results: BulkResult[] = userIds.map(userId => {
      const score = 400 + Math.floor(Math.abs(userId.charCodeAt(0) - 48) * 7) % 600
      const { label, riskLevel } = getScoreLabel(score)
      return { userId, status: 'ok', score, label, tier: riskLevel }
    })
    return Response.json({ results, total: results.length, processed: results.length })
  }

  // Check and deduct balance
  const serviceClient = createServiceClient()
  const { data: company } = await serviceClient
    .from('companies')
    .select('checks_remaining, checks_used')
    .eq('id', companyId)
    .single()

  const remaining = company?.checks_remaining ?? 0
  if (remaining < userIds.length) {
    return Response.json({
      error: `Insufficient check balance. Need ${userIds.length}, have ${remaining}. Please upgrade your plan.`,
      checksRemaining: remaining,
    }, { status: 402 })
  }

  // Process each user
  const results: BulkResult[] = await Promise.all(userIds.map(async (userId): Promise<BulkResult> => {
    try {
      const { data: creds } = await serviceClient
        .from('credentials')
        .select('*')
        .eq('user_id', userId)

      if (!creds || creds.length === 0) {
        return { userId, status: 'not_found', error: 'User has no credentials or does not exist' }
      }

      const mapped = creds.map(c => ({
        id: c.id, subjectUserId: c.user_id, credentialType: c.type as never,
        title: c.title ?? '', claim: {}, proofHash: '', confidence: c.confidence ?? 0.9,
        status: c.status as never, issuedAt: c.issued_at ?? c.created_at,
        expiresAt: c.expires_at ?? undefined,
      }))

      const result = computeScore(mapped)
      const { label, riskLevel } = getScoreLabel(result.score)
      return { userId, status: 'ok', score: result.score, label, tier: riskLevel }
    } catch {
      return { userId, status: 'error', error: 'Score computation failed' }
    }
  }))

  const processed = results.filter(r => r.status === 'ok').length

  // Deduct from balance (only count successful lookups)
  await serviceClient.from('companies').update({
    checks_remaining: remaining - processed,
    checks_used:      (company?.checks_used ?? 0) + processed,
  }).eq('id', companyId)

  // Audit log
  audit({
    actorId,
    action:     'bulk_verify.requested',
    targetType: 'company',
    targetId:   companyId,
    metadata:   { total: userIds.length, processed },
  }).catch(() => {})

  return Response.json({ results, total: userIds.length, processed })
}
