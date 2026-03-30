import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { users } from '@/lib/store'
import { demoLog } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit  = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
  const action = searchParams.get('action')  // optional filter by action prefix

  if (IS_DEMO_MODE) {
    let logs = [...demoLog].reverse()
    if (action) logs = logs.filter(l => l.action.startsWith(action))
    return Response.json({ logs: logs.slice(0, limit) })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const caller = users.find(u => u.id === user.id)
    if (!caller || caller.role !== 'admin') {
      const serviceClient = createServiceClient()
      const { data: profile } = await serviceClient.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = createServiceClient()
    let query = serviceClient
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (action) query = query.like('action', `${action}%`)

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ logs: data ?? [] })
  } catch {
    return Response.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
