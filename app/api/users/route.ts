import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { users as demoUsers } from '@/lib/store'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country     = searchParams.get('country')
  const accountType = searchParams.get('accountType')
  const q           = searchParams.get('q')

  const limitParam  = parseInt(searchParams.get('limit')  ?? '20', 10)
  const offsetParam = parseInt(searchParams.get('offset') ?? '0',  10)
  const limit  = Math.min(isNaN(limitParam)  ? 20 : Math.max(1, limitParam),  100)
  const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam)

  if (IS_DEMO_MODE) {
    let result = demoUsers.filter(u => u.role !== 'admin')
    if (country)     result = result.filter(u => u.country === country)
    if (accountType) result = result.filter(u => u.accountType === accountType)
    if (q) {
      const lower = q.toLowerCase()
      result = result.filter(u =>
        u.fullName.toLowerCase().includes(lower) ||
        u.profession.toLowerCase().includes(lower)
      )
    }
    const total = result.length
    return Response.json({ users: result.slice(offset, offset + limit), total, limit, offset })
  }

  try {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    let query = supabase
      .from('profiles')
      .select('id, full_name, country, city, profession, account_type, trust_score, id_verification_status, member_since, bio, did', { count: 'exact' })
      .neq('role', 'admin')
      .eq('id_verification_status', 'verified')

    if (country)     query = query.eq('country', country)
    if (accountType) query = query.eq('account_type', accountType)
    // Full-text search avoids the leading-wildcard problem of ilike('%q%'),
    // which cannot use a B-tree index and causes full table scans.
    // Requires a GIN index — see database/schema.sql for the index definition.
    if (q)           query = query.textSearch('full_name', q, { type: 'websearch' })

    const { data, error, count } = await query
      .order('trust_score', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ users: data ?? [], total: count ?? 0, limit, offset })
  } catch {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
