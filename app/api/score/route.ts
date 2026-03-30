import { credentials } from '@/lib/store'
import { computeScore, getScoreLabel } from '@/lib/scoring'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { validateApiKey } from '@/lib/api-auth'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'userId is required' }, { status: 400 })
  }

  // Accept both session auth (browser) and API key auth (programmatic)
  let authorized = false
  if (!IS_DEMO_MODE) {
    const companyId = await validateApiKey(request)
    if (companyId) {
      authorized = true
    } else {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) authorized = true
    }
    if (!authorized) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (IS_DEMO_MODE) {
    const userCredentials = credentials.filter(c => c.subjectUserId === userId)
    const result = computeScore(userCredentials)
    const { label, riskLevel } = getScoreLabel(result.score)
    return Response.json({ userId, score: result.score, label, tier: result.riskTier, riskLevel, confidence: result.confidence, credentialCount: result.credentialCount, dataAgeMonths: result.dataAgeMonths, breakdown: result.breakdown })
  }

  try {
    const serviceClient = createServiceClient()
    const { data: creds } = await serviceClient.from('credentials').select('*').eq('user_id', userId)
    const mapped = (creds ?? []).map(c => ({
      id: c.id, subjectUserId: c.user_id, credentialType: c.type as never,
      title: c.title ?? '', claim: {}, proofHash: '', confidence: c.confidence ?? 0.9,
      status: c.status as never, issuedAt: c.issued_at ?? c.created_at,
      expiresAt: c.expires_at ?? undefined,
    }))
    const result = computeScore(mapped)
    const { label, riskLevel } = getScoreLabel(result.score)
    return Response.json({ userId, score: result.score, label, tier: result.riskTier, riskLevel, confidence: result.confidence, credentialCount: result.credentialCount, dataAgeMonths: result.dataAgeMonths, breakdown: result.breakdown })
  } catch {
    return Response.json({ error: 'Failed to compute score' }, { status: 500 })
  }
}
