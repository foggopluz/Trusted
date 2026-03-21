import { credentials } from '@/lib/store'
import { computeScore, getScoreLabel } from '@/lib/scoring'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return Response.json({ error: 'userId is required' }, { status: 400 })
  }

  const userCredentials = credentials.filter(c => c.subjectUserId === userId)
  const result = computeScore(userCredentials)
  const { label, riskLevel } = getScoreLabel(result.score)

  return Response.json({
    userId,
    score: result.score,
    label,
    tier: result.riskTier,
    riskLevel,
    confidence: result.confidence,
    credentialCount: result.credentialCount,
    dataAgeMonths: result.dataAgeMonths,
    breakdown: result.breakdown,
  })
}
