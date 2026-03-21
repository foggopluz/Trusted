import Link from 'next/link'
import Nav from '@/app/components/Nav'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: 64 }}>
      <Nav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Legal</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: 32 }}>Terms of Service</h1>
        <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.8, marginBottom: 24 }}>
          By using TrustNet, you agree to provide accurate information during registration, to use trust scores only for legitimate verification purposes, and to respect the privacy of other users.
        </p>
        <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.8, marginBottom: 24 }}>
          TrustNet trust scores are informational only and do not constitute credit ratings or legal guarantees. Misuse of trust data or attempting to manipulate scores is prohibited and may result in account termination.
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 48 }}>Last updated: March 2026 · <Link href="/" style={{ color: 'var(--forest-mid)' }}>Back to TrustNet</Link></p>
      </div>
    </div>
  )
}
