// ─── API Key Management ────────────────────────────────────────────────────────
// POST   /api/keys  — generate a new API key for a company
// GET    /api/keys  — list keys for a company (hashed, never raw)
// DELETE /api/keys  — revoke a key by id

import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

const demoKeys: { id: string; companyId: string; keyPrefix: string; name: string; isActive: boolean; createdAt: string }[] = []

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateRawKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `tn_live_${hex}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return Response.json({ error: 'companyId is required' }, { status: 400 })

  if (IS_DEMO_MODE) {
    return Response.json({ keys: demoKeys.filter(k => k.companyId === companyId) })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()
    const { data: company } = await serviceClient.from('companies').select('owner_id').eq('id', companyId).single()
    if (!company || company.owner_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await serviceClient
      .from('api_keys')
      .select('id, key_prefix, name, is_active, last_used_at, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ keys: data ?? [] })
  } catch {
    return Response.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: { companyId?: string; name?: string }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { companyId, name } = body
  if (!companyId || !name?.trim()) {
    return Response.json({ error: 'companyId and name are required' }, { status: 400 })
  }

  if (IS_DEMO_MODE) {
    const rawKey = generateRawKey()
    const key = { id: `key-${Date.now()}`, companyId, keyPrefix: rawKey.slice(0, 10), name: name.trim(), isActive: true, createdAt: new Date().toISOString() }
    demoKeys.push(key)
    return Response.json({ key: { ...key, rawKey }, warning: 'Store this key now — it will not be shown again.' }, { status: 201 })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()
    const { data: company } = await serviceClient.from('companies').select('owner_id').eq('id', companyId).single()
    if (!company || company.owner_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Limit: max 5 active keys per company
    const { count } = await serviceClient.from('api_keys').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true)
    if ((count ?? 0) >= 5) return Response.json({ error: 'Maximum of 5 active API keys per company' }, { status: 400 })

    const rawKey = generateRawKey()
    const keyHash = await sha256(rawKey)
    const keyPrefix = rawKey.slice(0, 10)

    const { data: inserted, error } = await serviceClient
      .from('api_keys')
      .insert({ company_id: companyId, key_hash: keyHash, key_prefix: keyPrefix, name: name.trim() })
      .select('id, key_prefix, name, is_active, created_at')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    audit({ actorId: user.id, action: 'api_key.create', targetType: 'api_key', targetId: inserted.id, metadata: { companyId } }).catch(() => {})
    return Response.json({ key: { ...inserted, rawKey }, warning: 'Store this key now — it will not be shown again.' }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  if (IS_DEMO_MODE) {
    const idx = demoKeys.findIndex(k => k.id === id)
    if (idx === -1) return Response.json({ error: 'Key not found' }, { status: 404 })
    demoKeys[idx].isActive = false
    return Response.json({ ok: true })
  }

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()
    const { data: key } = await serviceClient.from('api_keys').select('company_id').eq('id', id).single()
    if (!key) return Response.json({ error: 'Key not found' }, { status: 404 })

    const { data: company } = await serviceClient.from('companies').select('owner_id').eq('id', key.company_id).single()
    if (!company || company.owner_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await serviceClient.from('api_keys').update({ is_active: false }).eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    audit({ actorId: user.id, action: 'api_key.revoke', targetType: 'api_key', targetId: id }).catch(() => {})
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }
}
