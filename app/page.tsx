'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import { Shield, ArrowRight, CheckCircle, Search, Star, Lock, Zap, Globe, Users, Building2, ChevronRight } from 'lucide-react'

const stats = [
  { value: '2,400+', label: 'Verified Members' },
  { value: '180+',   label: 'Registered Businesses' },
  { value: '12,000+',label: 'Trust Checks Completed' },
  { value: '6',      label: 'Countries Served' },
]

const howItWorks = [
  { step: '01', title: 'Register & Verify', desc: 'Create your account and verify your identity using your country\'s official ID method — NIDA, Huduma Namba, Ghana Card, BVN and more.' },
  { step: '02', title: 'Build Your Score', desc: 'Connect credentials from banks, SACCOs, employers and peers. Our engine weighs each by institution type, recency and provenance.' },
  { step: '03', title: 'Share with Control', desc: 'Share your verified trust profile with any employer or partner — you approve every request. Your data, your terms.' },
]

const features = [
  { icon: Shield, title: 'Anchored Identity', desc: 'Each user gets a Decentralized Identifier (DID) backed by official national ID verification.' },
  { icon: Zap,    title: 'Live Trust Engine', desc: 'Weighted by institution type, recency and provenance — a 0–1000 score computed in real time.' },
  { icon: Globe,  title: 'All Financial Institutions', desc: 'Central banks to SACCOs, mobile money and insurers — all institution types carry provenance-weighted credentials.' },
  { icon: Lock,   title: 'Consent-Gated Sharing', desc: 'Businesses can only view your data after you explicitly approve their request.' },
  { icon: Star,   title: 'Reputation Ratings', desc: 'Anyone can rate any user or business. Ratings are visible publicly but never alter the algorithmic score.' },
  { icon: Search, title: 'Public Lookup', desc: 'Search any registered user or business by name, location or profession to view their trust score and operating history.' },
]

const institutions = [
  { name: 'Bank of Tanzania',    type: 'Central Bank',   weight: '100%' },
  { name: 'CRDB Bank',           type: 'Commercial Bank', weight: '95%' },
  { name: 'Equity Bank Kenya',   type: 'Commercial Bank', weight: '95%' },
  { name: 'FINCA Tanzania',      type: 'Microfinance',    weight: '80%' },
  { name: 'Mwalimu SACCO',       type: 'Credit Union',    weight: '70%' },
  { name: 'Jubilee Insurance',   type: 'Insurance',       weight: '65%' },
  { name: 'M-Pesa (Vodacom)',    type: 'Mobile Money',    weight: '60%' },
  { name: 'Airtel Money',        type: 'Mobile Money',    weight: '60%' },
]

export default function LandingPage() {
  const router = useRouter()
  const [heroQuery, setHeroQuery] = useState('')

  function handleHeroSearch() {
    const q = heroQuery.trim()
    router.push(q ? `/lookup?q=${encodeURIComponent(q)}` : '/lookup')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Nav transparent />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="hero-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 pb-0 pt-32 w-full">
          <div style={{ maxWidth: 640 }}>

            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 mb-8 fade-up"
              style={{ background: 'rgba(200,144,12,.12)', border: '1px solid rgba(200,144,12,.3)', borderRadius: 999, padding: '6px 14px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
              <span style={{ color: 'var(--gold-lt)', fontSize: 12, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase' }}>
                Africa's Trust Infrastructure
              </span>
            </div>

            {/* Heading — Chaleto-style large italic serif */}
            <h1 className="fade-up fade-up-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px,7.5vw,88px)', fontWeight: 300, color: '#fff', lineHeight: 1.04, marginBottom: 28 }}>
              Your reputation,<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300 }}>verified</em>{' '}
              <span style={{ fontWeight: 600 }}>everywhere.</span>
            </h1>

            <p className="fade-up fade-up-2" style={{ color: 'rgba(255,255,255,.65)', fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 520 }}>
              TrustNet gives professionals a portable, cryptographically-verified trust score
              backed by every financial institution — and gives businesses instant confidence before they hire.
            </p>

            {/* CTAs — Chaleto style: filled dark + white outlined */}
            <div className="flex flex-wrap items-center gap-4 fade-up fade-up-3" style={{ marginBottom: 64 }}>
              <Link href="/login" className="btn btn-outline-white">
                Log In
              </Link>
              <Link href="/register" className="btn btn-gold">
                Register Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Lookup Bar — like Chaleto's search bar */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="card" style={{ borderRadius: '12px 12px 0 0', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, borderRight: '1px solid var(--border)', paddingRight: 24, marginRight: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Search</div>
                <input
                  value={heroQuery}
                  onChange={e => setHeroQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHeroSearch()}
                  placeholder="Name, profession or company…"
                  className="input"
                  style={{ border: 'none', padding: '4px 0', fontSize: 15, fontWeight: 500, boxShadow: 'none', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150, borderRight: '1px solid var(--border)', paddingRight: 24, marginRight: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Type</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-faint)' }}>Individual or Business</div>
              </div>
              <div style={{ flex: 1, minWidth: 120, paddingRight: 24, marginRight: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Country</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-faint)' }}>Any region</div>
              </div>
              <button onClick={handleHeroSearch} className="btn btn-gold" style={{ borderRadius: 8, padding: '13px 24px', flexShrink: 0 }}>
                <Search className="w-4 h-4" />
                <span>Look Up</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="section-charcoal">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="stat-num" style={{ fontSize: 38, color: 'var(--gold-lt)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS — dark forest section like Chaleto ──────────────── */}
      <section className="section-dark" style={{ padding: '100px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ marginBottom: 72 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>How it works</p>
            <h2 className="display-italic" style={{ fontSize: 'clamp(42px,5vw,68px)', color: '#fff' }}>
              Three steps to trusted.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="fade-up" style={{ animationDelay: `${i * .1}s` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 300, color: 'rgba(255,255,255,.08)', lineHeight: 1, marginBottom: 24 }}>{item.step}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: '#fff', marginBottom: 14 }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 15, lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — white section ──────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: 'var(--white)' }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ maxWidth: 560, marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Platform Features</p>
            <h2 className="display" style={{ fontSize: 'clamp(36px,4vw,52px)', color: 'var(--text)', marginBottom: 16 }}>
              Built for the way Africa works.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.75 }}>
              A layered trust architecture — from verified identity to real financial behaviour, work history, and peer endorsements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="card fade-up" style={{ padding: '28px', animationDelay: `${i * .07}s` }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--forest-pale)', marginBottom: 20 }}>
                  <f.icon className="w-5 h-5" style={{ color: 'var(--forest-mid)' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 40 }}>
            Provenance-weighted credentials from all financial institutions
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {institutions.map(inst => (
              <div key={inst.name} className="card-sm" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inst.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{inst.type}</div>
                </div>
                <span className="badge badge-gold" style={{ fontSize: 11 }}>{inst.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO-COLUMN CTA — Chaleto-style dark sections ──────────────────── */}
      <section style={{ background: 'var(--white)', padding: '100px 24px', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">

          {/* For Individuals */}
          <div className="card" style={{ padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--forest)' }} />
            <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--forest-pale)', marginBottom: 24 }}>
              <Users className="w-5 h-5" style={{ color: 'var(--forest-mid)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>For Individuals</h3>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28 }}>
              Build your verified reputation once. Share it everywhere — employers, lenders, trading partners.
              Never start from zero again.
            </p>
            <ul style={{ listStyle: 'none', marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Verified digital identity (DID)', 'Trust wallet with all credentials', 'Score backed by bank & SACCO history', 'Shareable, consent-gated profile link'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-mid)' }}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--forest-mid)' }} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link href="/register/individual" className="btn btn-forest">
                Register as Individual
              </Link>
              <Link href="/dashboard" className="btn btn-outline-dark">
                View Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* For Businesses */}
          <div className="card" style={{ padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--gold)' }} />
            <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-pale)', marginBottom: 24 }}>
              <Building2 className="w-5 h-5" style={{ color: 'var(--gold)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>For Businesses</h3>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28 }}>
              Instantly verify any freelancer before you hire. See their score, financial history,
              work record and endorsements — one click, user-approved.
            </p>
            <ul style={{ listStyle: 'none', marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Search verified freelancer pool', 'Request instant trust checks', 'Consent-gated — user always approves', 'Issue credentials after working together'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-mid)' }}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--gold)' }} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link href="/register/business" className="btn btn-gold">
                Register Business
              </Link>
              <Link href="/business/dashboard" className="btn btn-outline-dark">
                Business Portal
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="section-charcoal" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield className="w-4 h-4" style={{ color: '#fff' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff' }}>TrustNet</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', maxWidth: 300, lineHeight: 1.7 }}>
                Trust Infrastructure Platform for East Africa. Verified credentials, portable reputation.
              </p>
            </div>

            <div className="flex flex-wrap gap-12">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 14 }}>Platform</p>
                {[['/', 'Home'], ['/lookup', 'Lookup'], ['/register', 'Register'], ['/login', 'Log In']].map(([href, label]) => (
                  <div key={href} style={{ marginBottom: 8 }}>
                    <Link href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{label}</Link>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 14 }}>Account</p>
                {[['/dashboard', 'My Dashboard'], ['/business/dashboard', 'Business Portal'], ['/admin', 'Admin']].map(([href, label]) => (
                  <div key={href} style={{ marginBottom: 8 }}>
                    <Link href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{label}</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="gold-line" style={{ margin: '40px 0' }} />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.25)' }}>© 2026 TrustNet. All rights reserved.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.25)' }}>Dar es Salaam, Tanzania · api.trustnet.co.tz/v1</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
