// GET /api/admin/fraud?userId=<uuid> — run fraud assessment for a user (admin only)
// Returns a full fraud assessment with all signals and severity.

import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { assessFraudRisk } from '@/lib/fraud'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 })

  if (IS_DEMO_MODE) {
    const assessment = await assessFraudRisk({ userId })
    return Response.json(assessment)
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const assessment = await assessFraudRisk({ userId })
  return Response.json(assessment)
}
