import { createServiceClient } from '@/lib/supabase-server'
import { companies as demoCompanies } from '@/lib/store'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get('ownerId')

  if (IS_DEMO_MODE) {
    const result = ownerId
      ? demoCompanies.filter(c => c.ownerUserId === ownerId)
      : demoCompanies
    return Response.json({ companies: result })
  }

  try {
    const supabase = createServiceClient()
    let query = supabase.from('companies').select('*')
    if (ownerId) query = query.eq('owner_id', ownerId)
    const { data, error } = await query
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

    const supabase = createServiceClient()
    const { data, error } = await supabase.from('companies').insert(body).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ company: data }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
