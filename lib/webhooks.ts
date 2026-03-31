// ─── Webhook Dispatch ─────────────────────────────────────────────────────────
//
// Sends signed POST requests to company-registered URLs when TrustNet events occur.
//
// Payload signature: X-TrustNet-Signature: sha256=<hmac-sha256-hex>
// The HMAC is computed over the raw JSON body using the webhook's per-row secret.
//
// Supported event types:
//   score.changed          — user's TrustScore changed (credential approved/rejected)
//   credential.approved    — a credential was approved
//   credential.rejected    — a credential was rejected
//   trust_check.granted    — subject granted consent to a trust check
//   trust_check.denied     — subject denied consent to a trust check

import { createServiceClient } from './supabase-server'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export type WebhookEvent =
  | 'score.changed'
  | 'credential.approved'
  | 'credential.rejected'
  | 'trust_check.granted'
  | 'trust_check.denied'

export interface WebhookPayload {
  event:      WebhookEvent
  created_at: string
  data:       Record<string, unknown>
}

// ─── Signing ──────────────────────────────────────────────────────────────────

async function sign(body: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Dispatch to a single endpoint ────────────────────────────────────────────

async function dispatch(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  supabase: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const body      = JSON.stringify(payload)
  const signature = await sign(body, secret)
  let statusCode  = 0
  let responseText = ''
  let succeeded   = false

  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':           'application/json',
        'X-TrustNet-Event':       payload.event,
        'X-TrustNet-Signature':   `sha256=${signature}`,
        'X-TrustNet-Delivery-At': payload.created_at,
      },
      body,
      signal: AbortSignal.timeout(10_000),  // 10 s timeout
    })
    statusCode   = res.status
    responseText = await res.text().catch(() => '')
    succeeded    = res.ok
  } catch (err) {
    responseText = err instanceof Error ? err.message : 'Network error'
  }

  // Record delivery (fire-and-forget within this function — caller never awaits)
  void supabase.from('webhook_deliveries').insert({
    webhook_id:   webhookId,
    event:        payload.event,
    payload: payload as unknown as import('./supabase').Json,
    status:       succeeded ? 'success' : 'failed',
    status_code:  statusCode || null,
    response:     responseText.slice(0, 1000),
  })
}

// ─── Public: fire event to all matching subscribers ───────────────────────────

export async function fireWebhookEvent(
  event: WebhookEvent,
  data:  Record<string, unknown>,
): Promise<void> {
  if (IS_DEMO_MODE) return   // no-op in demo mode

  const supabase = createServiceClient()

  const { data: hooks } = await supabase
    .from('webhooks')
    .select('id, url, secret')
    .eq('is_active', true)
    .contains('events', [event])

  if (!hooks?.length) return

  const payload: WebhookPayload = {
    event,
    created_at: new Date().toISOString(),
    data,
  }

  // Dispatch all concurrently — individual failures don't block others
  await Promise.allSettled(
    hooks.map(hook => dispatch(hook.id, hook.url, hook.secret, payload, supabase)),
  )
}
