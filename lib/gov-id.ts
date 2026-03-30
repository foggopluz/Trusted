// ─── Government ID Verification ───────────────────────────────────────────────
//
// Abstraction layer for verifying national IDs against government registries.
// Primary provider: Smile Identity (covers TZ, KE, GH, NG, UG, RW).
// Falls back to a stub/demo mode when credentials are not configured.
//
// Smile Identity docs: https://docs.usesmileid.com/products/identity-lookup
//
// Required env vars:
//   SMILE_PARTNER_ID    — from Smile Identity dashboard
//   SMILE_API_KEY       — from Smile Identity dashboard
//   SMILE_ENVIRONMENT   — "sandbox" | "production" (default: sandbox)

const SMILE_PARTNER_ID  = process.env.SMILE_PARTNER_ID  ?? ''
const SMILE_API_KEY     = process.env.SMILE_API_KEY     ?? ''
const SMILE_ENVIRONMENT = (process.env.SMILE_ENVIRONMENT ?? 'sandbox') as 'sandbox' | 'production'

const SMILE_BASE_URL = SMILE_ENVIRONMENT === 'production'
  ? 'https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/prod'
  : 'https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/test'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GovIdType =
  | 'NIN'         // Tanzania NIDA / Nigeria NIN
  | 'BVN'         // Nigeria Bank Verification Number (NIMC-linked)
  | 'NATIONAL_ID' // Kenya IPRS / generic national ID
  | 'GHANA_CARD'  // Ghana NIA
  | 'PASSPORT'
  | 'VOTER_ID'    // Ghana / Uganda

export type GovIdCountry = 'TZ' | 'KE' | 'NG' | 'GH' | 'UG' | 'RW'

export interface GovIdVerifyOptions {
  country:      GovIdCountry
  idType:       GovIdType
  idNumber:     string
  firstName?:   string
  lastName?:    string
  dateOfBirth?: string   // YYYY-MM-DD
}

export interface GovIdVerifyResult {
  verified:     boolean
  source:       'smile_identity' | 'demo'
  country:      GovIdCountry
  idType:       GovIdType
  confidence:   number             // 0–1
  returnedName?: string            // name as held by registry
  error?:       string
  raw?:         Record<string, unknown>
}

// ─── Smile Identity HMAC sec_key ──────────────────────────────────────────────

async function buildSecKey(timestamp: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(SMILE_API_KEY)
  const msg     = encoder.encode(`${SMILE_PARTNER_ID}:${timestamp}`)
  const key     = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig     = await crypto.subtle.sign('HMAC', key, msg)
  const hex     = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex}|${SMILE_PARTNER_ID}`
}

// ─── Map our ID types to Smile Identity id_type strings ───────────────────────

const SMILE_ID_TYPE: Record<GovIdType, string> = {
  NIN:         'NIN',
  BVN:         'BVN',
  NATIONAL_ID: 'NATIONAL_ID',
  GHANA_CARD:  'GHANA_CARD',
  PASSPORT:    'PASSPORT',
  VOTER_ID:    'VOTER_ID',
}

// ─── Demo mode simulation ─────────────────────────────────────────────────────

const DEMO_VERIFIED_PREFIXES: Record<GovIdCountry, string> = {
  TZ: '19',
  KE: '3',
  NG: '55',
  GH: 'GHA-',
  UG: 'CM',
  RW: '119',
}

function simulateVerification(opts: GovIdVerifyOptions): GovIdVerifyResult {
  const prefix  = DEMO_VERIFIED_PREFIXES[opts.country] ?? ''
  const isMatch = opts.idNumber.startsWith(prefix)
  return {
    verified:     isMatch,
    source:       'demo',
    country:      opts.country,
    idType:       opts.idType,
    confidence:   isMatch ? 0.95 : 0,
    returnedName: isMatch ? `${opts.firstName ?? 'DEMO'} ${opts.lastName ?? 'USER'}`.toUpperCase() : undefined,
    error:        isMatch ? undefined : `Demo: numbers starting with "${prefix}" verify for ${opts.country}`,
  }
}

// ─── Main verify function ─────────────────────────────────────────────────────

export async function verifyGovernmentId(opts: GovIdVerifyOptions): Promise<GovIdVerifyResult> {
  if (!SMILE_PARTNER_ID || !SMILE_API_KEY) {
    return simulateVerification(opts)
  }

  const timestamp = new Date().toISOString()
  const secKey    = await buildSecKey(timestamp)

  const payload: Record<string, unknown> = {
    partner_id:  SMILE_PARTNER_ID,
    sec_key:     secKey,
    timestamp,
    country:     opts.country,
    id_type:     SMILE_ID_TYPE[opts.idType],
    id_number:   opts.idNumber,
  }
  if (opts.firstName)   payload.first_name   = opts.firstName
  if (opts.lastName)    payload.last_name     = opts.lastName
  if (opts.dateOfBirth) payload.dob           = opts.dateOfBirth

  try {
    const res  = await fetch(`${SMILE_BASE_URL}/id_verification`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json() as Record<string, unknown>

    if (!res.ok) {
      return {
        verified:   false,
        source:     'smile_identity',
        country:    opts.country,
        idType:     opts.idType,
        confidence: 0,
        error:      (data.error as string) ?? `Smile Identity returned ${res.status}`,
        raw:        data,
      }
    }

    // Smile Identity returns ResultCode 1012 for exact match, 1013 for partial
    const resultCode   = Number(data.ResultCode ?? data.result_code ?? 0)
    const verified     = resultCode === 1012 || resultCode === 1013
    const confidence   = resultCode === 1012 ? 1.0 : resultCode === 1013 ? 0.75 : 0

    const fullName = [data.FullName, data.full_name, data.Name]
      .find(v => typeof v === 'string') as string | undefined

    return {
      verified,
      source:       'smile_identity',
      country:      opts.country,
      idType:       opts.idType,
      confidence,
      returnedName: fullName,
      error:        verified ? undefined : ((data.ResultText ?? data.result_text) as string | undefined),
      raw:          data,
    }
  } catch (err) {
    return {
      verified:   false,
      source:     'smile_identity',
      country:    opts.country,
      idType:     opts.idType,
      confidence: 0,
      error:      err instanceof Error ? err.message : 'Network error contacting Smile Identity',
    }
  }
}

// ─── Supported ID types per country ───────────────────────────────────────────

export const SUPPORTED_ID_TYPES: Record<GovIdCountry, GovIdType[]> = {
  TZ: ['NIN', 'PASSPORT'],
  KE: ['NATIONAL_ID', 'PASSPORT'],
  NG: ['NIN', 'BVN', 'PASSPORT'],
  GH: ['GHANA_CARD', 'VOTER_ID', 'PASSPORT'],
  UG: ['NATIONAL_ID', 'PASSPORT'],
  RW: ['NATIONAL_ID', 'PASSPORT'],
}

export const COUNTRY_NAMES: Record<GovIdCountry, string> = {
  TZ: 'Tanzania',
  KE: 'Kenya',
  NG: 'Nigeria',
  GH: 'Ghana',
  UG: 'Uganda',
  RW: 'Rwanda',
}

export const ID_TYPE_LABELS: Record<GovIdType, string> = {
  NIN:         'National ID Number (NIN)',
  BVN:         'Bank Verification Number (BVN)',
  NATIONAL_ID: 'National ID Card',
  GHANA_CARD:  'Ghana Card',
  PASSPORT:    'Passport',
  VOTER_ID:    "Voter's ID",
}
