import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="hero-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>TrustNet</span>
      </div>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(80px, 14vw, 160px)', fontWeight: 600, color: 'rgba(255,255,255,0.08)', lineHeight: 1, marginBottom: 0, letterSpacing: '-0.05em' }}>404</p>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16, marginTop: -16 }}>
        Page not found
      </h1>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 400, lineHeight: 1.7, marginBottom: 44 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn btn-gold">Go Home</Link>
        <Link href="/lookup" className="btn btn-outline-white">Look Up a Profile</Link>
      </div>
    </div>
  )
}
