'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { Shield, RefreshCw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em' }}>TrustNet</span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: 16 }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 16, color: '#6B6B6B', maxWidth: 400, lineHeight: 1.7, marginBottom: 44 }}>
        An unexpected error occurred. This has been logged and we&apos;ll look into it.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <pre style={{ fontSize: 12, background: '#FFF5F5', color: '#B83232', padding: '12px 16px', borderRadius: 8, maxWidth: 560, textAlign: 'left', overflowX: 'auto', marginBottom: 32, border: '1px solid #FDDADA' }}>
          {error.message}
        </pre>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={reset} className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw style={{ width: 15, height: 15 }} /> Try Again
        </button>
        <Link href="/" className="btn btn-outline-dark">Go Home</Link>
      </div>
    </div>
  )
}
