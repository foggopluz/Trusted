import { credentials } from '@/lib/store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type   = searchParams.get('type')

    let result = credentials
    if (userId) result = result.filter(c => c.subjectUserId === userId)
    if (type)   result = result.filter(c => c.credentialType === type)

    return Response.json({ credentials: result })
  } catch {
    return Response.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, type, description, issuer_name, issuer_email, proof_url, status } = body

    if (!user_id) return Response.json({ error: 'user_id is required' }, { status: 400 })
    if (!type)    return Response.json({ error: 'type is required' }, { status: 400 })

    // In demo mode, return a simulated created credential (no DB write needed)
    const newCredential = {
      id:           `cred-${Date.now()}`,
      user_id,
      type,
      description:  description ?? null,
      issuer_name:  issuer_name ?? null,
      issuer_email: issuer_email ?? null,
      proof_url:    proof_url ?? null,
      status:       status ?? 'pending',
      created_at:   new Date().toISOString(),
    }

    return Response.json({ credential: newCredential }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create credential' }, { status: 500 })
  }
}
