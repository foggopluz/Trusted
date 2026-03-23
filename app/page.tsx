'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import StepCard from '@/components/landing/StepCard'
import DemoCard from '@/components/landing/DemoCard'
import StatItem from '@/components/landing/StatItem'
import { Shield, UserPlus, Share2 } from 'lucide-react'

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const steps = [
  {
    number: '1',
    icon: <UserPlus className="w-5 h-5" style={{ color: 'var(--forest-mid)' }} />,
    title: 'Create your verified profile',
    description:
      'Register with your national ID — NIDA, Huduma Namba, Ghana Card, BVN and more. Your identity is anchored to a Decentralized Identifier (DID) in minutes.',
  },
  {
    number: '2',
    icon: <Shield className="w-5 h-5" style={{ color: 'var(--forest-mid)' }} />,
    title: 'Collect trust credentials',
    description:
      'Connect banks, SACCOs, employers, and peer endorsements. Every credential is weighted by institution type and recency to build your 0–1000 score.',
  },
  {
    number: '3',
    icon: <Share2 className="w-5 h-5" style={{ color: 'var(--forest-mid)' }} />,
    title: 'Share your trust score anywhere',
    description:
      'Share a verified link with any employer or partner — you approve every request. One score, every opportunity, across all of Africa.',
  },
]

const stats = [
  { value: '2,400+',  label: 'Members' },
  { value: '180+',    label: 'Businesses' },
  { value: '12,000+', label: 'Checks Run' },
  { value: '6',       label: 'Countries' },
]

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

/** Fade-in-up hook — returns [ref, isVisible] */
function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  // Section refs for scroll-triggered visibility
  const [howRef, howVisible] = useFadeIn(0.1)
  const [demoRef, demoVisible] = useFadeIn(0.1)
  const [ctaRef, ctaVisible] = useFadeIn(0.2)

  // Hero float card visibility (delayed)
  const [heroCardVisible, setHeroCardVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setHeroCardVisible(true), 650)
    return () => clearTimeout(t)
  }, [])

  function scrollToDemo(e: React.MouseEvent) {
    e.preventDefault()
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: 'var(--font-body)' }}>
      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <Nav transparent />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(200,144,12,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Eyebrow pill */}
        <div
          className="fade-up"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--gold-pale)',
            border: '1px solid var(--gold-border)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 32,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--gold)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
            }}
          >
            Trust The World
          </span>
        </div>

        {/* Headline */}
        <h1
          className="display fade-up fade-up-1"
          style={{
            fontSize: 'clamp(48px, 7vw, 88px)',
            fontWeight: 400,
            color: '#0A0A0A',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            maxWidth: 820,
            marginBottom: 24,
          }}
        >
          Verify anyone.{' '}
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--forest-mid)' }}>
            Get trusted
          </em>{' '}
          instantly.
        </h1>

        {/* Subtext */}
        <p
          className="fade-up fade-up-2"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 20,
            color: '#6B6B6B',
            lineHeight: 1.65,
            maxWidth: 480,
            marginBottom: 44,
          }}
        >
          A portable trust score you can use anywhere in Africa.
        </p>

        {/* CTA Buttons */}
        <div
          className="fade-up fade-up-3"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 56,
          }}
        >
          <Link
            href="/lookup"
            className="btn btn-gold"
            style={{ fontSize: 15, padding: '14px 32px' }}
          >
            Check a Trust Score
          </Link>
          <Link
            href="/register"
            className="btn"
            style={{
              fontSize: 15,
              padding: '14px 32px',
              background: 'transparent',
              color: 'var(--forest)',
              border: '1.5px solid var(--forest)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'var(--forest-pale)'
              el.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.transform = 'translateY(0)'
            }}
          >
            Build Your Profile
          </Link>
          <a
            href="#demo"
            onClick={scrollToDemo}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 600,
              color: '#6B6B6B',
              textDecoration: 'none',
              padding: '14px 20px',
              transition: 'color 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B6B6B' }}
          >
            Try Demo
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2L7 12M7 12L3 8M7 12L11 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Thin separator */}
        <div
          className="fade-up fade-up-4"
          style={{
            width: '100%',
            maxWidth: 520,
            height: 1,
            background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
            marginBottom: 48,
          }}
        />

        {/* Floating demo card preview */}
        <div
          style={{
            opacity: heroCardVisible ? 1 : 0,
            transform: heroCardVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,0.68,0,1.2)',
          }}
        >
          <div
            className="card"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 20,
              padding: '20px 28px',
              borderRadius: 16,
              boxShadow: '0 8px 40px rgba(10,20,12,0.10)',
              animation: 'heroFloat 3.5s ease-in-out infinite',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--forest-pale), var(--gold-pale))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--forest-mid)',
                border: '2px solid var(--border)',
                flexShrink: 0,
              }}
            >
              AM
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 2,
                }}
              >
                Asha Mwinyi
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                Trust Score
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: 'var(--border)', marginLeft: 4 }} />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                812
              </div>
              <div
                style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-faint)' }}
              >
                / 1000
              </div>
            </div>
            <span className="badge badge-low" style={{ marginLeft: 4 }}>
              Very Low Risk
            </span>
          </div>
        </div>

        {/* Inline keyframe for floating animation */}
        <style>{`
          @keyframes heroFloat {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-8px); }
          }
        `}</style>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section
        style={{ background: '#FAFAFA', padding: '120px 24px', borderTop: '1px solid var(--border)' }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          {/* Section heading */}
          <div
            ref={howRef}
            style={{
              textAlign: 'center',
              marginBottom: 80,
              opacity: howVisible ? 1 : 0,
              transform: howVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 16,
              }}
            >
              How It Works
            </p>
            <h2
              className="display"
              style={{
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 400,
                color: '#0A0A0A',
                lineHeight: 1.1,
              }}
            >
              Simple. Powerful. Portable.
            </h2>
          </div>

          {/* Steps grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 48,
            }}
          >
            {steps.map((step, i) => (
              <StepCard
                key={step.number}
                number={step.number}
                icon={step.icon}
                title={step.title}
                description={step.description}
                delay={i * 120}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO SECTION ──────────────────────────────────────────────────────── */}
      <section
        id="demo"
        style={{
          background: '#FFFFFF',
          padding: '120px 24px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          ref={demoRef}
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 64,
            alignItems: 'center',
            opacity: demoVisible ? 1 : 0,
            transform: demoVisible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          {/* Left: text */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 16,
              }}
            >
              Live Demo
            </p>
            <h2
              className="display"
              style={{
                fontSize: 'clamp(36px, 4.5vw, 56px)',
                fontWeight: 400,
                color: '#0A0A0A',
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              See TrustNet
              <br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--forest-mid)' }}>
                in action.
              </em>
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                color: '#6B6B6B',
                lineHeight: 1.75,
                marginBottom: 36,
                maxWidth: 400,
              }}
            >
              Watch a real trust profile load — score, risk level, verified credentials, and
              endorsements — all in one portable card.
            </p>
            <Link
              href="/dashboard"
              className="btn btn-gold"
              style={{ fontSize: 15, padding: '14px 32px' }}
            >
              Try Interactive Demo
            </Link>
          </div>

          {/* Right: demo card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DemoCard />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--dark)',
          padding: '60px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
          }}
        >
          {stats.map(s => (
            <StatItem key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────────────── */}
      <section
        style={{
          background: '#FFFFFF',
          padding: '140px 24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div
          ref={ctaRef}
          style={{
            maxWidth: 600,
            margin: '0 auto',
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <h2
            className="display"
            style={{
              fontSize: 'clamp(40px, 5.5vw, 68px)',
              fontWeight: 400,
              color: '#0A0A0A',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}
          >
            Start building your trust today.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              color: '#6B6B6B',
              marginBottom: 44,
              lineHeight: 1.6,
            }}
          >
            Free to join. Verified in 48 hours.
          </p>
          <Link
            href="/register"
            className="btn btn-gold"
            style={{ fontSize: 16, padding: '16px 44px', borderRadius: 8 }}
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: 'var(--dark)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '60px 24px 40px' }}>
          {/* Top row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 40,
              marginBottom: 48,
            }}
          >
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield className="w-4 h-4" style={{ color: '#fff' }} />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                  }}
                >
                  TrustNet
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.38)',
                  maxWidth: 240,
                  lineHeight: 1.65,
                }}
              >
                Trust The World
              </p>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms' },
                { href: '/lookup', label: 'How TrustNet Works' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.45)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Gold line */}
          <div className="gold-line" style={{ marginBottom: 28 }} />

          {/* Bottom */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.22)',
              textAlign: 'center',
            }}
          >
            © 2026 TrustNet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
