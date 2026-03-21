'use client'
import Link from 'next/link'
import { Shield, User, Briefcase, Building2, ArrowRight, CheckCircle } from 'lucide-react'

const types = [
  {
    href: '/register/individual?type=job_seeker',
    icon: User,
    title: 'Job Seeker',
    sub: 'Individual',
    desc: 'Build a verified profile to share with potential employers. Showcase your skills, work history and identity.',
    perks: ['Free account', 'Verified identity badge', 'Trust score with every application'],
    accent: 'var(--forest)',
    accentBg: 'var(--forest-pale)',
  },
  {
    href: '/register/individual?type=professional',
    icon: Briefcase,
    title: 'Professional / Freelancer',
    sub: 'Individual',
    desc: 'Your portable reputation. Verified credentials from banks, employers and peers — share with any client, anywhere.',
    perks: ['Full trust wallet', 'Bank & SACCO credentials', 'Consent-gated profile sharing', 'Public lookup listing'],
    accent: 'var(--forest-mid)',
    accentBg: 'rgba(26,92,56,.08)',
    featured: true,
  },
  {
    href: '/register/business',
    icon: Building2,
    title: 'Business',
    sub: 'Organisation',
    desc: 'Verify your business, search the freelancer pool, and issue credentials to people you\'ve worked with.',
    perks: ['Company verification', 'Trust check credits', 'Issue credentials to talent', 'Business profile listing'],
    accent: 'var(--gold)',
    accentBg: 'var(--gold-pale)',
  },
]

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Top bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,14,8,.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: '#fff' }}>TrustNet</span>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>
            Already registered?{' '}
            <Link href="/login" style={{ color: 'var(--gold-lt)', fontWeight: 600, textDecoration: 'none' }}>Log in →</Link>
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-up">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Create Account</p>
          <h1 className="display" style={{ fontSize: 'clamp(36px,4vw,52px)', color: 'var(--text)', marginBottom: 16 }}>
            Who are you joining as?
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
            Choose the account type that best describes how you'll use TrustNet. You can always add more later.
          </p>
        </div>

        {/* Account type cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {types.map((t, i) => (
            <Link
              key={t.title}
              href={t.href}
              className="card fade-up"
              style={{
                padding: '36px 32px',
                textDecoration: 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform .2s, box-shadow .2s',
                animationDelay: `${i * .08}s`,
                outline: t.featured ? `2px solid ${t.accent}` : 'none',
              }}
            >
              {t.featured && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `var(--forest-mid)` }} />
              )}
              {t.featured && (
                <span className="badge badge-forest" style={{ position: 'absolute', top: 16, right: 16 }}>Most Popular</span>
              )}

              <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentBg, marginBottom: 24 }}>
                <t.icon className="w-6 h-6" style={{ color: t.accent }} />
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{t.sub}</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, color: 'var(--text)', margin: '6px 0 14px' }}>{t.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28 }}>{t.desc}</p>

              <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.perks.map(perk => (
                  <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-mid)' }}>
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: t.accent }} />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="btn btn-sm" style={{ background: t.accent, color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginTop: 36 }}>
          By registering you agree to TrustNet's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
