// POST /api/vc/verify — verify a W3C Verifiable Credential
// Public endpoint — no auth required (the VC contains its own proof)

import { verifyVC, type VerifiableCredential } from '@/lib/vc'

export async function POST(request: Request) {
  let vc: VerifiableCredential
  try {
    vc = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!vc?.proof || !vc?.credentialSubject || !vc?.issuer) {
    return Response.json({ error: 'Not a valid Verifiable Credential object' }, { status: 400 })
  }

  try {
    const result = await verifyVC(vc)
    return Response.json(result, { status: result.valid ? 200 : 422 })
  } catch {
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
