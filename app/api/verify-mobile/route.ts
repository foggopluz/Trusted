// POST /api/verify-mobile — verify a mobile money account (M-Pesa or MTN MoMo)
// Requires session auth or API key auth.
// In demo mode: simulates responses (numbers ending in 0000 fail).

import { createServerClient } from '@/lib/supabase-server'
import { validateApiKey } from '@/lib/api-auth'
import { verifyMobileMoneyAccount, PROVIDER_COUNTRIES, type MobileMoneyProvider } from '@/lib/mobile-money'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const VALID_PROVIDERS = new Set<string>(['mpesa', 'mtn_momo'])
const E164_RE = /^\+[1-9]\d{7,14}$/

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let actorId: string | undefined

  if (!IS_DEMO_MODE) {
    const companyId = await validateApiKey(request)
    if (companyId) {
      actorId = companyId
    } else {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) actorId = user.id
    }
    if (!actorId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { provider, phone_number, first_name, last_name } = body

  if (!provider || typeof provider !== 'string' || !VALID_PROVIDERS.has(provider)) {
    return Response.json({
      error: `provider must be one of: ${[...VALID_PROVIDERS].join(', ')}`,
    }, { status: 400 })
  }

  if (!phone_number || typeof phone_number !== 'string') {
    return Response.json({ error: 'phone_number is required' }, { status: 400 })
  }

  if (!E164_RE.test(phone_number)) {
    return Response.json({
      error: 'phone_number must be in E.164 format (e.g. +254712345678)',
    }, { status: 400 })
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  try {
    const result = await verifyMobileMoneyAccount({
      provider:    provider as MobileMoneyProvider,
      phoneNumber: phone_number,
      firstName:   typeof first_name === 'string' ? first_name : undefined,
      lastName:    typeof last_name  === 'string' ? last_name  : undefined,
    })

    audit({
      actorId,
      action:     result.verified ? 'mobile_money.verified' : 'mobile_money.failed',
      targetType: 'mobile_money',
      targetId:   provider,
      metadata:   { provider, confidence: result.confidence, source: result.source },
    }).catch(() => {})

    return Response.json(result, { status: result.verified ? 200 : 422 })
  } catch {
    return Response.json({ error: 'Verification service unavailable' }, { status: 500 })
  }
}

// ── GET /api/verify-mobile — return provider list ────────────────────────────

export async function GET() {
  return Response.json({ providers: PROVIDER_COUNTRIES })
}
