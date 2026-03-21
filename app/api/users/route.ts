import { createServiceClient } from '@/lib/supabase-server'
import { users as demoUsers } from '@/lib/store'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country     = searchParams.get('country')
  const accountType = searchParams.get('accountType')
  const q           = searchParams.get('q')

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
    return Response.json({ users: result })
  }

  try {
    const supabase = createServiceClient()
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .eq('id_verification_status', 'verified')

    if (country)     query = query.eq('country', country)
    if (accountType) query = query.eq('account_type', accountType)
    if (q)           query = query.ilike('full_name', `%${q}%`)

    const { data, error } = await query.order('trust_score', { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ users: data ?? [] })
  } catch {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
