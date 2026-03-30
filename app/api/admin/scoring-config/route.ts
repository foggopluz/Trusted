import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { users } from '@/lib/store'
import { DEFAULT_FACTOR_WEIGHTS, DEFAULT_RISK_THRESHOLDS } from '@/lib/scoring'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// In-memory config for demo mode
let demoConfig = {
  factorWeights: { ...DEFAULT_FACTOR_WEIGHTS },
  riskThresholds: { ...DEFAULT_RISK_THRESHOLDS },
}

export async function GET() {
  if (IS_DEMO_MODE) {
    return Response.json({ config: demoConfig })
  }

  try {
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from('scoring_config')
      .select('factor_weights, risk_thresholds')
      .eq('id', 1)
      .single()

    if (error || !data) {
      return Response.json({
        config: { factorWeights: DEFAULT_FACTOR_WEIGHTS, riskThresholds: DEFAULT_RISK_THRESHOLDS }
      })
    }

    return Response.json({
      config: {
        factorWeights: data.factor_weights,
        riskThresholds: data.risk_thresholds,
      }
    })
  } catch {
    return Response.json({ error: 'Failed to fetch scoring config' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  let body: { factorWeights?: Record<string, number>; riskThresholds?: Record<string, number> }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { factorWeights, riskThresholds } = body

  // Validate weights sum to ~1.0
  if (factorWeights) {
    const sum = Object.values(factorWeights).reduce((a, b) => a + b, 0)
    if (Math.abs(sum - 1.0) > 0.01) {
      return Response.json({ error: 'Factor weights must sum to 1.0' }, { status: 400 })
    }
  }

  // Validate thresholds
  if (riskThresholds) {
    if (
      typeof riskThresholds.low !== 'number' ||
      typeof riskThresholds.medium !== 'number' ||
      riskThresholds.low <= riskThresholds.medium ||
      riskThresholds.low > 1000 ||
      riskThresholds.medium < 0
    ) {
      return Response.json({ error: 'Invalid risk thresholds' }, { status: 400 })
    }
  }

  if (IS_DEMO_MODE) {
    if (factorWeights)  demoConfig.factorWeights  = factorWeights as typeof DEFAULT_FACTOR_WEIGHTS
    if (riskThresholds) demoConfig.riskThresholds = riskThresholds as typeof DEFAULT_RISK_THRESHOLDS
    return Response.json({ ok: true })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin check
    const caller = users.find(u => u.id === user.id)
    if (!caller || caller.role !== 'admin') {
      // Also check Supabase profile in production
      const serviceClient = createServiceClient()
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!profile || profile.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const serviceClient = createServiceClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id }
    if (factorWeights)  updates.factor_weights  = factorWeights
    if (riskThresholds) updates.risk_thresholds = riskThresholds

    const { error } = await serviceClient
      .from('scoring_config')
      .update(updates)
      .eq('id', 1)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to save scoring config' }, { status: 500 })
  }
}
