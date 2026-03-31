import { Credential, FinancialInstitution, ScoreResult, RiskTier, ConfidenceLevel } from './types'
import { financialInstitutions } from './store'

// ─── Supabase credential types ────────────────────────────────────────────────

export interface SupabaseCredential {
  id: string
  type: 'employment' | 'payment' | 'endorsement' | 'identity' | 'skill'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  expires_at?: string | null
  rating?: number
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

export interface SupabaseScoreResult {
  score: number
  riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk'
  riskTier: 'high' | 'medium' | 'low'
  breakdown: {
    employment: number
    payments: number
    endorsements: number
    identity: number
  }
  confidence: 'low' | 'medium' | 'high'
  credentialCount: number
}

export const DEFAULT_FACTOR_WEIGHTS = {
  identity: 0.15,
  financial: 0.25,
  work_history: 0.25,
  endorsement: 0.15,
  skill: 0.20,
}

export const DEFAULT_RISK_THRESHOLDS = {
  low: 700,
  medium: 450,
}

export interface ScoringConfig {
  factorWeights: typeof DEFAULT_FACTOR_WEIGHTS
  riskThresholds: typeof DEFAULT_RISK_THRESHOLDS
}

const MAX_DISPUTE_PENALTY = 0.20

function monthsAgo(dateStr: string): number {
  const issued = new Date(dateStr)
  const now = new Date()
  return (Date.now() - issued.getTime()) / (1000 * 60 * 60 * 24 * 365.25 / 12)
}

function recencyMultiplier(issuedAt: string): number {
  return monthsAgo(issuedAt) <= 6 ? 2.0 : 1.0
}

function getProvenance(credential: Credential): number {
  if (credential.issuerInstitutionId) {
    const inst = financialInstitutions.find(f => f.id === credential.issuerInstitutionId)
    return inst ? inst.provenanceWeight : 0.60
  }
  // Admin-issued (identity, skill) → high provenance
  if (credential.issuerUserId === 'u-admin') return 0.98
  // Business-issued → medium-high
  if (credential.issuerCompanyId) return 0.85
  // Peer endorsement
  return 0.70
}

export function computeScore(
  credentials: Credential[],
  disputeCount = 0,
  config?: Partial<ScoringConfig>,
): ScoreResult {
  const weights = config?.factorWeights ?? DEFAULT_FACTOR_WEIGHTS
  const thresholds = config?.riskThresholds ?? DEFAULT_RISK_THRESHOLDS

  const ACTIVE_STATUSES = new Set(['active', 'approved'])
  const active = credentials.filter(c => ACTIVE_STATUSES.has(c.status) && !isExpired(c.expiresAt))

  let identityRaw = 0
  let financialRaw = 0
  let workRaw = 0
  let networkRaw = 0

  for (const cred of active) {
    const weight = weights[cred.credentialType] ?? 0.05
    const provenance = getProvenance(cred)
    const recency = recencyMultiplier(cred.issuedAt)
    const contribution = weight * provenance * recency * cred.confidence

    if (cred.credentialType === 'identity') identityRaw += contribution
    else if (cred.credentialType === 'financial') financialRaw += contribution
    else if (cred.credentialType === 'work_history') workRaw += contribution
    else if (cred.credentialType === 'endorsement' || cred.credentialType === 'skill') networkRaw += contribution
  }

  const totalRaw = identityRaw + financialRaw + workRaw + networkRaw

  // Dispute penalty
  const disputeRatio = Math.min(disputeCount / Math.max(active.length, 1), 1)
  const disputePenalty = disputeRatio * MAX_DISPUTE_PENALTY

  const penalisedRaw = totalRaw * (1 - disputePenalty)
  const score = Math.round(Math.min(penalisedRaw * 1000, 1000))

  // Risk tier (uses configurable thresholds)
  let riskTier: RiskTier
  if (score >= thresholds.low) riskTier = 'low'
  else if (score >= thresholds.medium) riskTier = 'medium'
  else riskTier = 'high'

  // Confidence
  let confidence: ConfidenceLevel
  if (active.length >= 5) confidence = 'high'
  else if (active.length >= 2) confidence = 'medium'
  else confidence = 'low'

  // Data age — oldest active credential
  const ages = active.map(c => monthsAgo(c.issuedAt))
  const dataAgeMonths = ages.length > 0 ? Math.round(Math.max(...ages)) : 0

  return {
    score,
    riskTier,
    confidence,
    dataAgeMonths,
    credentialCount: active.length,
    breakdown: {
      identity: Math.round(identityRaw * 1000),
      financial: Math.round(financialRaw * 1000),
      contractPerformance: Math.round(workRaw * 1000),
      networkTrust: Math.round(networkRaw * 1000),
      disputePenalty: Math.round(disputePenalty * 1000),
    },
  }
}

export function getRiskColor(tier: RiskTier) {
  return { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }[tier]
}

export function getRiskBadgeClass(tier: RiskTier) {
  return {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  }[tier]
}

export function getScoreColor(score: number) {
  if (score >= 700) return '#22c55e'
  if (score >= 450) return '#f59e0b'
  return '#ef4444'
}

export function getScoreLabel(score: number): { label: string; riskLevel: RiskTier } {
  if (score >= 850) return { label: 'Excellent',    riskLevel: 'low' }
  if (score >= 700) return { label: 'Good',         riskLevel: 'low' }
  if (score >= 600) return { label: 'Fair',         riskLevel: 'medium' }
  if (score >= 450) return { label: 'Moderate',     riskLevel: 'medium' }
  if (score >= 250) return { label: 'Poor',         riskLevel: 'high' }
  return               { label: 'Very Poor',     riskLevel: 'high' }
}

// ─── Business score ───────────────────────────────────────────────────────────

export interface BusinessScoreResult {
  score: number
  riskTier: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  dataAgeMonths: number
  credentialCount: number
  breakdown: {
    identity: number
    financial: number
    contractPerformance: number
    networkTrust: number
    disputePenalty: number
  }
}

export function computeBusinessScore(
  verificationStatus: string,
  foundedAt: string,
): BusinessScoreResult {
  const verified = verificationStatus === 'verified'
  const ageMonths = Math.floor((Date.now() - new Date(foundedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const ageFactor = Math.min(ageMonths / 36, 1) // max out at 3 years
  const companyScore = verified
    ? Math.round(650 + ageFactor * 250)   // 650–900 for verified businesses
    : Math.round(200 + ageFactor * 150)   // 200–350 for unverified
  const riskTier: 'low' | 'medium' | 'high' =
    companyScore >= 700 ? 'low' : companyScore >= 450 ? 'medium' : 'high'

  return {
    score: companyScore,
    riskTier,
    confidence: verified ? 'high' : 'low',
    dataAgeMonths: ageMonths,
    credentialCount: verified ? 3 : 0,
    breakdown: {
      identity:            verified ? Math.round(companyScore * 0.20) : 0,
      financial:           verified ? Math.round(companyScore * 0.30) : 0,
      contractPerformance: verified ? Math.round(companyScore * 0.30) : 0,
      networkTrust:        verified ? Math.round(companyScore * 0.20) : 0,
      disputePenalty:      0,
    },
  }
}

// ─── Supabase-based scoring ───────────────────────────────────────────────────

function supabaseRecencyMultiplier(createdAt: string): number {
  const ageMonths = monthsAgo(createdAt)
  if (ageMonths <= 6) return 1.5
  if (ageMonths <= 12) return 1.2
  return 1.0
}

export function computeScoreFromSupabase(
  credentials: SupabaseCredential[],
  verificationStatus: string,
): SupabaseScoreResult {
  const approved = credentials.filter(c => c.status === 'approved' && !isExpired(c.expires_at))

  // Employment (work_history mapped to employment)
  const employmentCreds = approved.filter(c => c.type === 'employment')
  let employmentRaw = 0
  for (const cred of employmentCreds) {
    employmentRaw += 40 * supabaseRecencyMultiplier(cred.created_at)
  }
  const employmentScore = Math.min(Math.round(employmentRaw), 400)

  // Payments
  const paymentCreds = approved.filter(c => c.type === 'payment')
  let paymentRaw = 0
  for (const cred of paymentCreds) {
    paymentRaw += 35 * supabaseRecencyMultiplier(cred.created_at)
  }
  const paymentScore = Math.min(Math.round(paymentRaw), 350)

  // Endorsements
  const endorsementCreds = approved.filter(c => c.type === 'endorsement')
  let endorsementRaw = 0
  for (const cred of endorsementCreds) {
    const ratingMultiplier = cred.rating != null ? cred.rating / 5 : 1.0
    endorsementRaw += 15 * ratingMultiplier
  }
  const endorsementScore = Math.min(Math.round(endorsementRaw), 150)

  // Identity
  let identityScore: number
  if (verificationStatus === 'verified') identityScore = 100
  else if (verificationStatus === 'pending') identityScore = 30
  else identityScore = 0

  const rawScore = employmentScore + paymentScore + endorsementScore + identityScore
  const score = Math.min(Math.round(rawScore), 1000)

  // Risk tier and level
  let riskTier: 'high' | 'medium' | 'low'
  let riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk'
  if (score >= 701) {
    riskTier = 'low'
    riskLevel = 'Low Risk'
  } else if (score >= 401) {
    riskTier = 'medium'
    riskLevel = 'Medium Risk'
  } else {
    riskTier = 'high'
    riskLevel = 'High Risk'
  }

  // Confidence based on total approved credential count
  let confidence: 'low' | 'medium' | 'high'
  if (approved.length >= 5) confidence = 'high'
  else if (approved.length >= 2) confidence = 'medium'
  else confidence = 'low'

  return {
    score,
    riskLevel,
    riskTier,
    breakdown: {
      employment: employmentScore,
      payments: paymentScore,
      endorsements: endorsementScore,
      identity: identityScore,
    },
    confidence,
    credentialCount: approved.length,
  }
}
