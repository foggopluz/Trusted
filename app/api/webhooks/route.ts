// GET  /api/webhooks — list webhooks for the authenticated company
// POST /api/webhooks — register a new webhook
// DELETE /api/webhooks?id=<uuid> — deactivate a webhook

import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { type WebhookEvent } from '@/lib/webhooks'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const VALID_EVENTS = new Set<WebhookEvent>([
  'score.changed',
  'credential.approved',
  'credential.rejected',
  'trust_check.granted',
  'trust_check.denied',
])

async function getCompanyId(request: Request): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  return data?.id ?? null
}

function generateSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function GET(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ webhooks: [] })

  const companyId = await getCompanyId(request)
  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('webhooks')
    .select('id, url, events, is_active, created_at')  // never return secret
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ webhooks: data ?? [] })
}

export async function POST(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ error: 'Webhooks require a Supabase connection' }, { status: 503 })

  const companyId = await getCompanyId(request)
  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url, events } = body

  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'url is required' }, { status: 400 })
  }

  try { new URL(url) } catch {
    return Response.json({ error: 'url must be a valid HTTPS URL' }, { status: 400 })
  }

  if (!url.startsWith('https://')) {
    return Response.json({ error: 'url must use HTTPS' }, { status: 400 })
  }

  if (!Array.isArray(events) || events.length === 0) {
    return Response.json({
      error: `events must be a non-empty array. Valid values: ${[...VALID_EVENTS].join(', ')}`,
    }, { status: 400 })
  }

  const invalidEvents = (events as string[]).filter(e => !VALID_EVENTS.has(e as WebhookEvent))
  if (invalidEvents.length > 0) {
    return Response.json({
      error: `Unknown events: ${invalidEvents.join(', ')}. Valid: ${[...VALID_EVENTS].join(', ')}`,
    }, { status: 400 })
  }

  // Enforce max 10 webhooks per company
  const serviceClient = createServiceClient()
  const { count } = await serviceClient
    .from('webhooks')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_active', true)
  if ((count ?? 0) >= 10) {
    return Response.json({ error: 'Maximum of 10 active webhooks per company' }, { status: 422 })
  }

  const secret = generateSecret()
  const { data, error } = await serviceClient
    .from('webhooks')
    .insert({ company_id: companyId, url, events, secret })
    .select('id, url, events, is_active, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Return the secret once — it cannot be retrieved again
  return Response.json({ webhook: { ...data, secret } }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ ok: true })

  const companyId = await getCompanyId(request)
  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('webhooks')
    .update({ is_active: false })
    .eq('id', id)
    .eq('company_id', companyId)  // prevents deactivating other companies' webhooks

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
