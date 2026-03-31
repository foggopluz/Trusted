// POST /api/vc/verify — verify a W3C Verifiable Credential
// Public endpoint — no auth required (the VC contains its own proof)

import { NextRequest, NextResponse } from 'next/server'
import { verifyVC, type VerifiableCredential } from '@/lib/vc'
import { createServiceClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const rl = checkRateLimit(`vc-verify:${ip}`, 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ valid: false, error: 'Too many requests' }, { status: 429 })
  }

  let vc: VerifiableCredential
  try {
    vc = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!vc?.proof || !vc?.credentialSubject || !vc?.issuer) {
    return NextResponse.json({ error: 'Not a valid Verifiable Credential object' }, { status: 400 })
  }

  try {
    const result = await verifyVC(vc)

    if (result.valid && !IS_DEMO_MODE && vc.id) {
      const serviceClient = createServiceClient()
      const { data: dbCred } = await serviceClient
        .from('credentials')
        .select('status')
        .eq('id', vc.id)
        .single()
      if (!dbCred || dbCred.status === 'revoked' || dbCred.status === 'rejected') {
        return NextResponse.json({ valid: false, error: 'Credential has been revoked' }, { status: 422 })
      }
    }

    return NextResponse.json(result, { status: result.valid ? 200 : 422 })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
