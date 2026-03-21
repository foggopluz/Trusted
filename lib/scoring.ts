import { Credential, FinancialInstitution, ScoreResult, RiskTier, ConfidenceLevel } from './types'
import { financialInstitutions } from './store'

const FACTOR_WEIGHTS = {
  identity: 0.15,
  financial: 0.25,
  work_history: 0.25,
  endorsement: 0.15,
  skill: 0.05,
}

const MAX_DISPUTE_PENALTY = 0.20

function monthsAgo(dateStr: string): number {
  const issued = new Date(dateStr)
  const now = new Date()
  return (now.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24 * 30)
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

export function computeScore(credentials: Credential[], disputeCount = 0): ScoreResult {
  const active = credentials.filter(c => c.status === 'active')

  let identityRaw = 0
  let financialRaw = 0
  let workRaw = 0
  let networkRaw = 0

  for (const cred of active) {
    const weight = FACTOR_WEIGHTS[cred.credentialType] ?? 0.05
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

  // Risk tier
  let riskTier: RiskTier
  if (score >= 700) riskTier = 'low'
  else if (score >= 450) riskTier = 'medium'
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
