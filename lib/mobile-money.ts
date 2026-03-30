// ─── Mobile Money Verification ────────────────────────────────────────────────
//
// Verifies mobile money account ownership and activity for financial credentialing.
// Supported providers:
//   - M-Pesa (Safaricom Kenya / Vodacom Tanzania) via Daraja API
//   - MTN Mobile Money via MoMo API (Uganda, Ghana, Rwanda, Nigeria)
//
// In demo mode: simulates account lookups without network calls.
//
// Required env vars per provider:
//
//   M-PESA (Kenya/Tanzania):
//     MPESA_CONSUMER_KEY     — from Safaricom Daraja developer portal
//     MPESA_CONSUMER_SECRET  — from Safaricom Daraja developer portal
//     MPESA_ENVIRONMENT      — "sandbox" | "production" (default: sandbox)
//
//   MTN MoMo:
//     MTN_MOMO_SUBSCRIPTION_KEY  — primary/secondary key from MTN MoMo developer portal
//     MTN_MOMO_API_USER_ID       — UUID generated via provisioning API
//     MTN_MOMO_API_KEY           — API key for the user ID
//     MTN_MOMO_ENVIRONMENT       — "sandbox" | "production" (default: sandbox)
//     MTN_MOMO_TARGET_ENVIRONMENT — "sandbox" | country code e.g. "mtncameroon" (default: sandbox)

// ─── Types ────────────────────────────────────────────────────────────────────

export type MobileMoneyProvider = 'mpesa' | 'mtn_momo'

export interface MobileMoneyVerifyOptions {
  provider:    MobileMoneyProvider
  phoneNumber: string   // E.164 format: +2547XXXXXXXX
  firstName?:  string
  lastName?:   string
}

export interface MobileMoneyVerifyResult {
  verified:      boolean
  source:        MobileMoneyProvider | 'demo'
  phoneNumber:   string
  provider:      MobileMoneyProvider
  confidence:    number          // 0–1
  accountName?:  string          // name as held by provider
  isActive:      boolean         // account is active and usable
  error?:        string
}

// ─── M-Pesa Daraja ────────────────────────────────────────────────────────────

const MPESA_ENV        = (process.env.MPESA_ENVIRONMENT ?? 'sandbox') as 'sandbox' | 'production'
const MPESA_KEY        = process.env.MPESA_CONSUMER_KEY    ?? ''
const MPESA_SECRET     = process.env.MPESA_CONSUMER_SECRET ?? ''
const MPESA_BASE_URL   = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke'

async function getMpesaToken(): Promise<string> {
  const credentials = Buffer.from(`${MPESA_KEY}:${MPESA_SECRET}`).toString('base64')
  const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

async function verifyMpesa(opts: MobileMoneyVerifyOptions): Promise<MobileMoneyVerifyResult> {
  // Daraja Customer Name Lookup (Business Lookup API)
  // Endpoint: POST /v1/business/name_lookup
  // The phone must be in the format 2547XXXXXXXX (no leading +)
  const msisdn = opts.phoneNumber.replace(/^\+/, '')

  try {
    const token = await getMpesaToken()
    const res   = await fetch(`${MPESA_BASE_URL}/v1/business/name_lookup`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Msisdn: msisdn }),
    })

    const data = await res.json() as Record<string, unknown>

    if (!res.ok || data.ResponseCode !== '0') {
      return {
        verified:    false,
        source:      'mpesa',
        phoneNumber: opts.phoneNumber,
        provider:    'mpesa',
        confidence:  0,
        isActive:    false,
        error:       (data.ResponseDescription as string) ?? `M-Pesa returned ${res.status}`,
      }
    }

    const accountName = data.Names as string | undefined
    return {
      verified:     true,
      source:       'mpesa',
      phoneNumber:  opts.phoneNumber,
      provider:     'mpesa',
      confidence:   1.0,
      accountName,
      isActive:     true,
    }
  } catch (err) {
    return {
      verified:    false,
      source:      'mpesa',
      phoneNumber: opts.phoneNumber,
      provider:    'mpesa',
      confidence:  0,
      isActive:    false,
      error:       err instanceof Error ? err.message : 'M-Pesa service unavailable',
    }
  }
}

// ─── MTN MoMo ─────────────────────────────────────────────────────────────────

const MTN_ENV            = (process.env.MTN_MOMO_ENVIRONMENT         ?? 'sandbox') as 'sandbox' | 'production'
const MTN_SUB_KEY        = process.env.MTN_MOMO_SUBSCRIPTION_KEY     ?? ''
const MTN_API_USER_ID    = process.env.MTN_MOMO_API_USER_ID          ?? ''
const MTN_API_KEY        = process.env.MTN_MOMO_API_KEY              ?? ''
const MTN_TARGET_ENV     = process.env.MTN_MOMO_TARGET_ENVIRONMENT   ?? 'sandbox'
const MTN_BASE_URL       = MTN_ENV === 'production'
  ? 'https://proxy.momoapi.mtn.com'
  : 'https://sandbox.momodeveloper.mtn.com'

async function getMtnToken(): Promise<string> {
  const credentials = Buffer.from(`${MTN_API_USER_ID}:${MTN_API_KEY}`).toString('base64')
  const res = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method:  'POST',
    headers: {
      Authorization:           `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': MTN_SUB_KEY,
    },
  })
  if (!res.ok) throw new Error(`MTN MoMo auth failed: ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

async function verifyMtn(opts: MobileMoneyVerifyOptions): Promise<MobileMoneyVerifyResult> {
  // MTN MoMo: GET /collection/v1_0/accountholder/msisdn/{accountHolderMSISDN}/basicuserinfo
  const msisdn = opts.phoneNumber.replace(/^\+/, '')

  try {
    const token = await getMtnToken()
    const res   = await fetch(
      `${MTN_BASE_URL}/collection/v1_0/accountholder/msisdn/${msisdn}/basicuserinfo`,
      {
        headers: {
          Authorization:               `Bearer ${token}`,
          'Ocp-Apim-Subscription-Key': MTN_SUB_KEY,
          'X-Target-Environment':      MTN_TARGET_ENV,
        },
      },
    )

    if (res.status === 404) {
      return {
        verified:    false,
        source:      'mtn_momo',
        phoneNumber: opts.phoneNumber,
        provider:    'mtn_momo',
        confidence:  0,
        isActive:    false,
        error:       'Account not found',
      }
    }

    if (!res.ok) {
      return {
        verified:    false,
        source:      'mtn_momo',
        phoneNumber: opts.phoneNumber,
        provider:    'mtn_momo',
        confidence:  0,
        isActive:    false,
        error:       `MTN MoMo returned ${res.status}`,
      }
    }

    const data = await res.json() as Record<string, unknown>
    const given  = data.given_name  as string | undefined
    const family = data.family_name as string | undefined
    const accountName = [given, family].filter(Boolean).join(' ') || undefined

    return {
      verified:    true,
      source:      'mtn_momo',
      phoneNumber: opts.phoneNumber,
      provider:    'mtn_momo',
      confidence:  1.0,
      accountName,
      isActive:    true,
    }
  } catch (err) {
    return {
      verified:    false,
      source:      'mtn_momo',
      phoneNumber: opts.phoneNumber,
      provider:    'mtn_momo',
      confidence:  0,
      isActive:    false,
      error:       err instanceof Error ? err.message : 'MTN MoMo service unavailable',
    }
  }
}

// ─── Demo mode ────────────────────────────────────────────────────────────────

function simulateMobileMoney(opts: MobileMoneyVerifyOptions): MobileMoneyVerifyResult {
  // Numbers with 7 unique digits after country code pass in demo
  const digits  = opts.phoneNumber.replace(/\D/g, '')
  const isValid = digits.length >= 10 && !digits.endsWith('0000')
  return {
    verified:     isValid,
    source:       'demo',
    phoneNumber:  opts.phoneNumber,
    provider:     opts.provider,
    confidence:   isValid ? 0.9 : 0,
    accountName:  isValid
      ? `${opts.firstName ?? 'DEMO'} ${opts.lastName ?? 'USER'}`.toUpperCase()
      : undefined,
    isActive:     isValid,
    error:        isValid ? undefined : 'Demo: numbers ending in 0000 fail verification',
  }
}

// ─── Main verify function ─────────────────────────────────────────────────────

const IS_MPESA_CONFIGURED = !!(MPESA_KEY && MPESA_SECRET)
const IS_MTN_CONFIGURED   = !!(MTN_SUB_KEY && MTN_API_USER_ID && MTN_API_KEY)

export async function verifyMobileMoneyAccount(
  opts: MobileMoneyVerifyOptions,
): Promise<MobileMoneyVerifyResult> {
  if (opts.provider === 'mpesa') {
    if (!IS_MPESA_CONFIGURED) return simulateMobileMoney(opts)
    return verifyMpesa(opts)
  }
  if (opts.provider === 'mtn_momo') {
    if (!IS_MTN_CONFIGURED) return simulateMobileMoney(opts)
    return verifyMtn(opts)
  }
  return {
    verified:    false,
    source:      'demo',
    phoneNumber: opts.phoneNumber,
    provider:    opts.provider,
    confidence:  0,
    isActive:    false,
    error:       `Unknown provider: ${opts.provider}`,
  }
}

// ─── Provider metadata ────────────────────────────────────────────────────────

export const PROVIDER_LABELS: Record<MobileMoneyProvider, string> = {
  mpesa:    'M-Pesa (Safaricom / Vodacom)',
  mtn_momo: 'MTN Mobile Money',
}

// Countries where each provider is available
export const PROVIDER_COUNTRIES: Record<MobileMoneyProvider, string[]> = {
  mpesa:    ['KE', 'TZ'],
  mtn_momo: ['UG', 'GH', 'RW', 'NG', 'CM', 'CI'],
}
