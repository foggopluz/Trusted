// POST /api/verify-id — verify a government-issued ID against national registry
// Requires session auth or API key auth.
// In demo mode: uses simulated verification (numbers with known prefixes pass).

import { createServerClient } from '@/lib/supabase-server'
import { validateApiKey } from '@/lib/api-auth'
import { verifyGovernmentId, SUPPORTED_ID_TYPES, type GovIdCountry, type GovIdType } from '@/lib/gov-id'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const VALID_COUNTRIES = new Set<string>(['TZ', 'KE', 'NG', 'GH', 'UG', 'RW'])

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  let userId: string | null = null

  if (!IS_DEMO_MODE) {
    const companyId = await validateApiKey(request)
    if (companyId) {
      userId = companyId  // API key callers identified by company
    } else {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    }
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { country, id_type, id_number, first_name, last_name, date_of_birth } = body

  if (!country || typeof country !== 'string' || !VALID_COUNTRIES.has(country)) {
    return Response.json({
      error: `country must be one of: ${[...VALID_COUNTRIES].join(', ')}`,
    }, { status: 400 })
  }

  if (!id_type || typeof id_type !== 'string') {
    return Response.json({ error: 'id_type is required' }, { status: 400 })
  }

  const supported = SUPPORTED_ID_TYPES[country as GovIdCountry]
  if (!supported.includes(id_type as GovIdType)) {
    return Response.json({
      error: `id_type "${id_type}" is not supported for ${country}. Supported: ${supported.join(', ')}`,
    }, { status: 400 })
  }

  if (!id_number || typeof id_number !== 'string' || id_number.trim().length === 0) {
    return Response.json({ error: 'id_number is required' }, { status: 400 })
  }

  // ── Verify ───────────────────────────────────────────────────────────────
  try {
    const result = await verifyGovernmentId({
      country:      country as GovIdCountry,
      idType:       id_type as GovIdType,
      idNumber:     id_number.trim(),
      firstName:    typeof first_name === 'string' ? first_name : undefined,
      lastName:     typeof last_name  === 'string' ? last_name  : undefined,
      dateOfBirth:  typeof date_of_birth === 'string' ? date_of_birth : undefined,
    })

    // Audit the verification attempt (fire-and-forget)
    audit({
      actorId:    userId ?? undefined,
      action:     result.verified ? 'gov_id.verified' : 'gov_id.failed',
      targetType: 'gov_id',
      targetId:   `${country}:${id_type}`,
      metadata:   { country, id_type, source: result.source, confidence: result.confidence },
    }).catch(() => {})

    // Never return the raw Smile Identity payload to callers
    const { raw: _raw, ...safeResult } = result
    return Response.json(safeResult, { status: result.verified ? 200 : 422 })
  } catch {
    return Response.json({ error: 'Verification service unavailable' }, { status: 500 })
  }
}
