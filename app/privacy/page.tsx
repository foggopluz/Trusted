import Link from 'next/link'
import Nav from '@/components/Nav'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: 64 }}>
      <Nav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Legal</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 400, letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: 32 }}>Privacy Policy</h1>
        <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.8, marginBottom: 24 }}>
          TrustNet is committed to protecting your personal information. This policy explains what data we collect, how we use it, and how you can control it.
        </p>
        <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.8, marginBottom: 24 }}>
          We collect only the minimum information needed to verify your identity and build your trust score. Your data is never sold to third parties. You can request deletion of your account and all associated data at any time.
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 48 }}>Last updated: March 2026 · <Link href="/" style={{ color: 'var(--forest-mid)' }}>Back to TrustNet</Link></p>
      </div>
    </div>
  )
}
