// ─── API Key Authentication ────────────────────────────────────────────────────
// Use validateApiKey() in public API routes that accept Bearer token auth.
// Returns the company_id on success, or null on failure.
//
// Usage in a route handler:
//   const companyId = await validateApiKey(request)
//   if (!companyId) return Response.json({ error: 'Invalid API key' }, { status: 401 })

import { createServiceClient } from './supabase-server'
import { audit } from './audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function validateApiKey(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer tn_live_')) return null

  const rawKey = authHeader.slice('Bearer '.length)

  if (IS_DEMO_MODE) return null  // API key auth not available in demo mode

  try {
    const keyHash = await sha256(rawKey)
    const serviceClient = createServiceClient()

    const { data: key } = await serviceClient
      .from('api_keys')
      .select('id, company_id, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (!key || !key.is_active) return null

    // Update last_used_at (fire-and-forget)
    serviceClient.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id).then(() => {})
    audit({ action: 'api_key.used', targetType: 'api_key', targetId: key.id, metadata: { companyId: key.company_id } }).catch(() => {})

    return key.company_id as string
  } catch {
    return null
  }
}
