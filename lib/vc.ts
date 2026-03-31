// ─── W3C Verifiable Credentials (Lightweight Implementation) ─────────────────
//
// Implements a subset of the W3C VC Data Model 1.1:
// https://www.w3.org/TR/vc-data-model/
//
// DID method: did:trustnet:<userId>
// Proof type: Ed25519Signature2020 (simulated with HMAC-SHA256 using server secret)
//
// For production: replace HMAC proof with real Ed25519 signing using the
// Web Crypto API and store keypairs in a KMS or Supabase Vault.

const PROOF_SECRET = process.env.VC_PROOF_SECRET
const ISSUER_DID   = process.env.VC_ISSUER_DID   ?? 'did:trustnet:trustnet-platform'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerifiableCredential {
  '@context': string[]
  type: string[]
  id: string
  issuer: string
  issuanceDate: string
  expirationDate?: string
  credentialSubject: {
    id: string               // did:trustnet:<userId>
    [key: string]: unknown
  }
  proof: {
    type: string
    created: string
    verificationMethod: string
    proofValue: string       // HMAC-SHA256 hex of the unsigned VC
  }
}

export interface VCVerificationResult {
  valid: boolean
  expired: boolean
  credentialId: string
  subjectDid: string
  issuerDid: string
  issuanceDate: string
  credentialType: string[]
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hmacSign(data: string): Promise<string> {
  const encoder  = new TextEncoder()
  const keyData  = encoder.encode(PROOF_SECRET!)
  const msgData  = encoder.encode(data)
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, msgData)
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacVerify(data: string, expectedSig: string): Promise<boolean> {
  const actual = await hmacSign(data)
  // Constant-time comparison
  if (actual.length !== expectedSig.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }
  return diff === 0
}

// ─── Issue a Verifiable Credential ────────────────────────────────────────────

export async function issueVC(opts: {
  credentialId: string
  subjectUserId: string
  credentialType: string          // e.g. 'IdentityCredential', 'EmploymentCredential'
  claims: Record<string, unknown>
  issuanceDate?: string
  expirationDate?: string
}): Promise<VerifiableCredential> {
  if (!PROOF_SECRET) throw new Error('VC_PROOF_SECRET env var is required in production')
  const issuanceDate = opts.issuanceDate ?? new Date().toISOString()
  const subjectDid   = `did:trustnet:${opts.subjectUserId}`

  const unsigned: Omit<VerifiableCredential, 'proof'> = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://trustnet.app/contexts/v1',
    ],
    type: ['VerifiableCredential', opts.credentialType],
    id: `https://trustnet.app/credentials/${opts.credentialId}`,
    issuer: ISSUER_DID,
    issuanceDate,
    ...(opts.expirationDate ? { expirationDate: opts.expirationDate } : {}),
    credentialSubject: {
      id: subjectDid,
      ...opts.claims,
    },
  }

  const payload     = JSON.stringify(unsigned)
  const proofValue  = await hmacSign(payload)

  return {
    ...unsigned,
    proof: {
      type: 'TrustNetHmacSignature2024',
      created: issuanceDate,
      verificationMethod: `${ISSUER_DID}#key-1`,
      proofValue,
    },
  }
}

// ─── Verify a Verifiable Credential ───────────────────────────────────────────

export async function verifyVC(vc: VerifiableCredential): Promise<VCVerificationResult> {
  const base: Pick<VCVerificationResult, 'credentialId' | 'subjectDid' | 'issuerDid' | 'issuanceDate' | 'credentialType'> = {
    credentialId:   vc.id,
    subjectDid:     String(vc.credentialSubject.id),
    issuerDid:      vc.issuer,
    issuanceDate:   vc.issuanceDate,
    credentialType: vc.type,
  }

  // Check expiry
  if (vc.expirationDate && new Date(vc.expirationDate).getTime() < Date.now()) {
    return { ...base, valid: false, expired: true, error: 'Credential has expired' }
  }

  // Verify proof
  const { proof, ...unsigned } = vc
  const payload   = JSON.stringify(unsigned)
  const isValid   = await hmacVerify(payload, proof.proofValue)

  if (!isValid) {
    return { ...base, valid: false, expired: false, error: 'Proof verification failed' }
  }

  return { ...base, valid: true, expired: false }
}

// ─── Canonical VC type names ───────────────────────────────────────────────────

export const VC_TYPE_MAP: Record<string, string> = {
  identity:     'IdentityCredential',
  financial:    'FinancialCredential',
  work_history: 'EmploymentCredential',
  endorsement:  'EndorsementCredential',
  skill:        'SkillCredential',
}
