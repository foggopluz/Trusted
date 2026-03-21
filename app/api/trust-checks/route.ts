import { trustChecks } from '@/lib/store'
import type { TrustCheck } from '@/lib/types'

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
