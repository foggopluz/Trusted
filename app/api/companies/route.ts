import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { companies as demoCompanies } from '@/lib/store'
import { PLAN_CHECK_LIMITS, type SubscriptionPlan } from '@/lib/types'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get('ownerId')
  const q       = searchParams.get('q')
  const country = searchParams.get('country')

  if (IS_DEMO_MODE) {
    let result = ownerId
      ? demoCompanies.filter(c => c.ownerUserId === ownerId)
      : demoCompanies
    if (country) result = result.filter(c => c.country === country)
    if (q) {
      const lower = q.toLowerCase()
      result = result.filter(c =>
        c.businessName.toLowerCase().includes(lower) ||
        c.industry.toLowerCase().includes(lower)
      )
    }
    return Response.json({ companies: result.slice(0, 50) })
  }

  // Public lookup (no ownerId) does not require auth
  if (!ownerId) {
    try {
      const supabase = createServiceClient()
      let query = supabase.from('companies').select('*')
      if (country) query = query.eq('country', country)
      if (q)       query = query.ilike('business_name', `%${q}%`)
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ companies: data ?? [] })
    } catch {
      return Response.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }
  }

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ companies: data ?? [] })
  } catch {
    return Response.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (IS_DEMO_MODE) {
      return Response.json({ company: { id: `co-${Date.now()}`, ...body }, ok: true }, { status: 201 })
    }

    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { ownerId: _ignored, owner_id: _ignored2, ...rest } = body
    const plan = (rest.subscription_plan ?? 'free') as SubscriptionPlan
    const checksRemaining = PLAN_CHECK_LIMITS[plan] ?? PLAN_CHECK_LIMITS.free
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('companies')
      .insert({ ...rest, owner_id: user.id, checks_remaining: checksRemaining, checks_used: 0 })
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ company: data }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
