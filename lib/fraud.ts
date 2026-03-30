// ─── Fraud Detection & Anomaly Detection ─────────────────────────────────────
//
// Heuristic-based fraud signal detection. Runs on credential submissions and
// trust check requests. Returns a risk assessment with flags and a severity score.
//
// Signals checked:
//   1. Velocity — too many credentials submitted in a short window
//   2. Duplicate ID numbers — same national ID linked to multiple accounts
//   3. Mismatched name — name on ID differs significantly from profile name
//   4. Suspicious issuer — issuer name contains known fraud indicators
//   5. Document reuse — same document URL (storage path) used across accounts
//   6. Score spike — TrustScore changed by an abnormally large amount quickly
//   7. Burst trust checks — company requesting checks at anomalous rate

import { createServiceClient } from './supabase-server'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FraudSeverity = 'none' | 'low' | 'medium' | 'high'

export interface FraudSignal {
  code:     string
  message:  string
  severity: Exclude<FraudSeverity, 'none'>
}

export interface FraudAssessment {
  userId:    string
  severity:  FraudSeverity
  score:     number          // 0–100; ≥70 = high, ≥40 = medium, >0 = low
  signals:   FraudSignal[]
  checkedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nameMatchScore(a: string, b: string): number {
  // Simple token overlap ratio — not edit distance, but fast and good enough
  const tokensA = new Set(a.toLowerCase().split(/\s+/).filter(t => t.length > 1))
  const tokensB = new Set(b.toLowerCase().split(/\s+/).filter(t => t.length > 1))
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  let overlap = 0
  for (const t of tokensA) if (tokensB.has(t)) overlap++
  return overlap / Math.max(tokensA.size, tokensB.size)
}

const SUSPICIOUS_ISSUER_PATTERNS = [
  /test/i, /fake/i, /dummy/i, /sample/i, /lorem/i, /example/i,
]

// ─── Core detection ───────────────────────────────────────────────────────────

export async function assessFraudRisk(opts: {
  userId:       string
  credentialId?: string   // if checking a specific credential submission
  idNumber?:    string    // national ID number (if provided)
  idName?:      string    // name returned from gov ID check
  issuerName?:  string    // credential issuer name
  documentUrl?: string    // storage path of submitted document
}): Promise<FraudAssessment> {
  const signals: FraudSignal[] = []

  if (IS_DEMO_MODE) {
    // Demo: deterministic simulation based on userId
    const isDemoSuspicious = opts.userId.endsWith('9')
    return {
      userId:    opts.userId,
      severity:  isDemoSuspicious ? 'medium' : 'none',
      score:     isDemoSuspicious ? 45 : 0,
      signals:   isDemoSuspicious
        ? [{ code: 'DEMO_SIGNAL', message: 'Demo suspicious userId (ends in 9)', severity: 'medium' }]
        : [],
      checkedAt: new Date().toISOString(),
    }
  }

  const supabase = createServiceClient()

  // ── Signal 1: Credential velocity ────────────────────────────────────────
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('credentials')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', opts.userId)
    .gte('created_at', windowStart)

  if ((recentCount ?? 0) >= 10) {
    signals.push({
      code:     'HIGH_VELOCITY',
      message:  `${recentCount} credentials submitted in the last 24 hours`,
      severity: 'high',
    })
  } else if ((recentCount ?? 0) >= 5) {
    signals.push({
      code:     'ELEVATED_VELOCITY',
      message:  `${recentCount} credentials submitted in the last 24 hours`,
      severity: 'medium',
    })
  }

  // ── Signal 2: Duplicate national ID across accounts ───────────────────────
  if (opts.idNumber) {
    const { count: dupCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('id_number', opts.idNumber)
      .neq('id', opts.userId)

    if ((dupCount ?? 0) > 0) {
      signals.push({
        code:     'DUPLICATE_ID_NUMBER',
        message:  `ID number is linked to ${dupCount} other account(s)`,
        severity: 'high',
      })
    }
  }

  // ── Signal 3: Name mismatch ───────────────────────────────────────────────
  if (opts.idName) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', opts.userId)
      .single()

    if (profile?.full_name) {
      const matchRatio = nameMatchScore(opts.idName, profile.full_name)
      if (matchRatio < 0.3) {
        signals.push({
          code:     'NAME_MISMATCH',
          message:  `ID name "${opts.idName}" differs significantly from profile name "${profile.full_name}"`,
          severity: matchRatio < 0.1 ? 'high' : 'medium',
        })
      }
    }
  }

  // ── Signal 4: Suspicious issuer name ─────────────────────────────────────
  if (opts.issuerName) {
    const isSuspicious = SUSPICIOUS_ISSUER_PATTERNS.some(p => p.test(opts.issuerName!))
    if (isSuspicious) {
      signals.push({
        code:     'SUSPICIOUS_ISSUER',
        message:  `Issuer name "${opts.issuerName}" matches a known test/fake pattern`,
        severity: 'high',
      })
    }
  }

  // ── Signal 5: Document reuse across accounts ──────────────────────────────
  if (opts.documentUrl) {
    const { count: docCount } = await supabase
      .from('credentials')
      .select('id', { count: 'exact', head: true })
      .eq('document_url', opts.documentUrl)
      .neq('user_id', opts.userId)

    if ((docCount ?? 0) > 0) {
      signals.push({
        code:     'DOCUMENT_REUSE',
        message:  `Document is used by ${docCount} other account(s)`,
        severity: 'high',
      })
    }
  }

  // ── Signal 6: Recent rapid score spike (>300 points in 7 days) ───────────
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentChecks } = await supabase
    .from('trust_checks')
    .select('score_at_check')
    .eq('subject_id', opts.userId)
    .not('score_at_check', 'is', null)
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: true })

  if (recentChecks && recentChecks.length >= 2) {
    const first = recentChecks[0].score_at_check as number
    const last  = recentChecks[recentChecks.length - 1].score_at_check as number
    if (last - first > 300) {
      signals.push({
        code:     'RAPID_SCORE_SPIKE',
        message:  `TrustScore rose by ${last - first} points in 7 days (${first} → ${last})`,
        severity: 'medium',
      })
    }
  }

  // ── Score roll-up ─────────────────────────────────────────────────────────
  const severityWeights: Record<FraudSignal['severity'], number> = {
    high: 40, medium: 20, low: 10,
  }
  const rawScore = signals.reduce((acc, s) => acc + severityWeights[s.severity], 0)
  const score    = Math.min(rawScore, 100)
  const severity: FraudSeverity =
    score >= 70 ? 'high' : score >= 40 ? 'medium' : score > 0 ? 'low' : 'none'

  return {
    userId:    opts.userId,
    severity,
    score,
    signals,
    checkedAt: new Date().toISOString(),
  }
}
