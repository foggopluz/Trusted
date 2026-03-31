// ─── Audit Logger ─────────────────────────────────────────────────────────────
// Call audit() from API route handlers to record sensitive actions.
// Uses the service role client so it bypasses RLS (the INSERT policy blocks
// client-side writes — only the service role can write audit rows).
//
// All calls are fire-and-forget: failures are logged but never thrown.

import { createServiceClient } from './supabase-server'
import type { Json } from './supabase'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// In-memory audit log for demo mode (not persisted across requests)
const demoLog: {
  actorId?: string; action: string; targetType?: string; targetId?: string
  metadata?: Record<string, unknown>; createdAt: string
}[] = []

export async function audit(opts: {
  actorId?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  if (IS_DEMO_MODE) {
    demoLog.push({ ...opts, createdAt: new Date().toISOString() })
    return
  }

  try {
    const serviceClient = createServiceClient()
    await serviceClient.from('audit_logs').insert({
      actor_id:    opts.actorId ?? null,
      action:      opts.action,
      target_type: opts.targetType ?? null,
      target_id:   opts.targetId ?? null,
      metadata:    (opts.metadata ?? {}) as Json,
    })
  } catch (err) {
    console.error('[audit] Failed to write log:', err)
  }
}

export { demoLog }
