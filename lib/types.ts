export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type CredentialType = 'identity' | 'work_history' | 'endorsement' | 'financial' | 'skill'
export type CredentialStatus = 'pending' | 'active' | 'revoked' | 'expired'
export type RiskTier = 'low' | 'medium' | 'high'
export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type UserRole = 'individual' | 'business' | 'admin'
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise'
export type ConsentStatus = 'pending' | 'granted' | 'denied'
export type AccountType = 'job_seeker' | 'professional' | 'business'
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected'
export type ChangeRequestField = 'business_name' | 'contact_phone' | 'contact_email' | 'address'

export type FinancialInstitutionType =
  | 'central_bank'
  | 'commercial_bank'
  | 'microfinance'
  | 'credit_union'
  | 'insurance'
  | 'mobile_money'

export const INSTITUTION_PROVENANCE: Record<FinancialInstitutionType, number> = {
  central_bank:    1.0,
  commercial_bank: 0.95,
  microfinance:    0.80,
  credit_union:    0.70,
  insurance:       0.65,
  mobile_money:    0.60,
}

export const INSTITUTION_LABELS: Record<FinancialInstitutionType, string> = {
  central_bank:    'Central Bank / Government',
  commercial_bank: 'Commercial Bank',
  microfinance:    'Microfinance Institution',
  credit_union:    'Credit Union / SACCO',
  insurance:       'Insurance Company',
  mobile_money:    'Mobile Money Provider',
}

// Verification methods vary by country/region
export type VerificationMethod =
  | 'national_id'
  | 'passport'
  | 'drivers_license'
  | 'nida'          // Tanzania
  | 'huduma_namba'  // Kenya
  | 'ghana_card'    // Ghana
  | 'bvn'           // Nigeria BVN
  | 'tin'           // Tax ID (businesses)
  | 'brn'           // Business Registration Number
  | 'cac'           // Nigeria CAC

export const COUNTRY_VERIFICATION_METHODS: Record<string, VerificationMethod[]> = {
  'Tanzania':   ['nida', 'national_id', 'passport', 'tin'],
  'Kenya':      ['huduma_namba', 'national_id', 'passport', 'tin'],
  'Ghana':      ['ghana_card', 'national_id', 'passport', 'tin'],
  'Nigeria':    ['bvn', 'national_id', 'passport', 'cac', 'tin'],
  'Uganda':     ['national_id', 'drivers_license', 'passport', 'brn', 'tin'],
  'Rwanda':     ['national_id', 'drivers_license', 'passport', 'brn', 'tin'],
  'Other':      ['passport', 'national_id'],
}

export const VERIFICATION_METHOD_LABELS: Record<VerificationMethod, string> = {
  national_id:   'National ID Card',
  passport:      'International Passport',
  drivers_license: "Driver's License",
  nida:          'NIDA Number (Tanzania)',
  huduma_namba:  'Huduma Namba (Kenya)',
  ghana_card:    'Ghana Card',
  bvn:           'BVN — Bank Verification Number',
  tin:           'TIN — Tax Identification Number',
  brn:           'Business Registration Number',
  cac:           'CAC Number (Nigeria)',
}

export interface FinancialInstitution {
  id: string
  name: string
  type: FinancialInstitutionType
  country: string
  verified: boolean
  provenanceWeight: number
}

export interface User {
  id: string
  did: string
  phone: string
  email?: string
  fullName: string
  profession: string
  location: string
  country: string
  accountType: AccountType
  idVerificationStatus: VerificationStatus
  idDocumentUrl?: string
  trustScore: number
  scoreConfidence: ConfidenceLevel
  role: UserRole
  profilePhoto?: string
  bio?: string
  createdAt: string
  memberSince: string // human-readable
}

export interface Company {
  id: string
  ownerUserId: string
  businessName: string
  tinNumber: string
  industry: string
  country: string
  address?: string
  contactPhone?: string
  contactEmail?: string
  website?: string
  description?: string
  verificationStatus: VerificationStatus
  subscriptionPlan: SubscriptionPlan
  checksRemaining: number
  checksUsed: number
  foundedAt: string
  memberSince: string
}

export interface Credential {
  id: string
  subjectUserId: string
  issuerUserId?: string
  issuerCompanyId?: string
  issuerInstitutionId?: string
  credentialType: CredentialType
  title: string
  claim: Record<string, unknown>
  proofHash: string
  confidence: number
  status: CredentialStatus
  issuedAt: string
  expiresAt?: string
}

export interface TrustCheck {
  id: string
  requesterCompanyId: string
  subjectUserId: string
  consentStatus: ConsentStatus
  scoreAtCheck?: number
  riskTier?: RiskTier
  credentialsShared: string[]
  createdAt: string
}

export interface Rating {
  id: string
  raterId: string           // user who gave the rating
  raterName: string
  targetId: string          // user or company being rated
  targetType: 'user' | 'company'
  stars: number             // 1-5
  comment?: string
  createdAt: string
}

export interface ChangeRequest {
  id: string
  companyId: string
  companyName: string
  requestedBy: string       // user id
  field: ChangeRequestField
  currentValue: string
  requestedValue: string
  reason: string
  status: ChangeRequestStatus
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface Endorsement {
  id: string
  endorserUserId: string
  endorsedUserId: string
  skill: string
  comment?: string
  endorserTrustScore: number
  createdAt: string
}

export interface ScoreResult {
  score: number
  riskTier: RiskTier
  confidence: ConfidenceLevel
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
