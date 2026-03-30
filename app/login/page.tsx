'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowRight, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Demo credentials — always work without Supabase
const DEMO_CREDENTIALS = [
  { email: 'demo@trustnet.com',    password: 'demo1234', redirect: '/dashboard' },
  { email: 'business@trustnet.com', password: 'demo1234', redirect: '/business/dashboard' },
  { email: 'admin@trustnet.com',   password: 'admin1234', redirect: '/admin' },
]

function checkDemoLogin(email: string, password: string): string | null {
  // Check hard-coded demo credentials
  const match = DEMO_CREDENTIALS.find(
    d => d.email.toLowerCase() === email.toLowerCase() && d.password === password
  )
  if (match) return match.redirect

  // Check users registered this session (stored by registration flow)
  try {
    const stored = JSON.parse(sessionStorage.getItem('tn_demo_users') || '[]') as { email: string; password: string }[]
    const sessionMatch = stored.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (sessionMatch) return '/dashboard'
  } catch { /* ignore */ }

  return null
}

export default function LoginPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Check demo / session-registered credentials first (always works)
      const demoRedirect = checkDemoLogin(form.email, form.password)
      if (demoRedirect) {
        // Store who is logged in for the dashboard to pick up
        try {
          const stored = JSON.parse(sessionStorage.getItem('tn_demo_users') || '[]') as {
            email: string; name?: string; fullName?: string; phone?: string;
            country?: string; city?: string; profession?: string; accountType?: string; role?: string;
            businessName?: string; industry?: string;
          }[]
          const found = stored.find(u => u.email.toLowerCase() === form.email.toLowerCase())
          // Hardcoded demo accounts get their known names
          const hardcodedNames: Record<string, string> = {
            'demo@trustnet.com':     'Amina Hassan',
            'business@trustnet.com': 'Simba Tech Solutions',
            'admin@trustnet.com':    'TrustNet Admin',
          }
          const session = {
            email: form.email,
            name:        found?.fullName ?? found?.name ?? hardcodedNames[form.email.toLowerCase()] ?? form.email.split('@')[0],
            fullName:    found?.fullName ?? found?.name ?? hardcodedNames[form.email.toLowerCase()] ?? form.email.split('@')[0],
            phone:       found?.phone ?? '',
            country:     found?.country ?? '',
            city:        found?.city ?? '',
            profession:  found?.profession ?? '',
            accountType: found?.accountType ?? 'individual',
            role:        found?.role ?? 'individual',
            businessName: found?.businessName ?? '',
            industry:    found?.industry ?? '',
            isHardcodedDemo: !found,
          }
          sessionStorage.setItem('tn_current_user', JSON.stringify(session))
        } catch { /* ignore */ }
        router.push(demoRedirect)
        return
      }

      // 2. Try real Supabase auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (authError) {
        // If Supabase is not configured (demo mode), show a helpful error
        const isNetworkError = authError.message.includes('fetch') || authError.message.includes('network') || authError.message.includes('Failed')
        if (isNetworkError) {
          setError('No account found with those credentials. If you just registered, use the email and password you chose during registration.')
        } else {
          setError(authError.message)
        }
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('No account found with those credentials. If you just registered, use the email and password you chose during sign-up.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(email: string, password: string) {
    setForm({ email, password })
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — dark panel */}
      <div className="hidden lg:flex flex-col justify-between hero-dark" style={{ width: '45%', padding: '48px', flexShrink: 0 }}>
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield className="w-5 h-5" style={{ color: '#fff' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>TrustNet</span>
        </Link>

        <div>
          <h2 className="display-italic" style={{ fontSize: 52, color: '#fff', marginBottom: 24 }}>
            Welcome back.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', lineHeight: 1.75, maxWidth: 380 }}>
            Your trust score, credentials and reputation — waiting for you exactly as you left them.
          </p>
        </div>

        {/* Score demo card */}
        <div className="glass-dark" style={{ borderRadius: 14, padding: '24px 28px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>Demo Account</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Amina Hassan</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>UX Designer · Dar es Salaam</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 600, color: 'var(--gold-lt)', lineHeight: 1 }}>842</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>/ 1000</span>
          </div>
          <span className="badge badge-low" style={{ marginTop: 12, display: 'inline-flex' }}>Low Risk</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: 'var(--white)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10" style={{ textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>TrustNet</span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Log In</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'none' }}>Create an account →</Link>
          </p>

          {/* Demo mode notice */}
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', marginBottom: 24, fontSize: 13 }}>
            <Info style={{ width: 15, height: 15, color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: 'var(--text-mid)', lineHeight: 1.5 }}>
              <strong>Demo mode:</strong> Use <code style={{ background: 'rgba(0,0,0,.06)', padding: '1px 5px', borderRadius: 4 }}>demo@trustnet.com</code> / <code style={{ background: 'rgba(0,0,0,.06)', padding: '1px 5px', borderRadius: 4 }}>demo1234</code>, or use the email &amp; password you created during registration.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--forest-mid)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: 44 }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--risk-high)', marginBottom: 16, padding: '10px 14px', background: 'var(--risk-high-bg)', borderRadius: 8, lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--forest)' }} />
              Remember me for 30 days
            </label>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in…' : 'Log In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>OR JUMP STRAIGHT IN</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Quick access */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Quick demo access — no login required</p>
            {[
              { href: '/dashboard',          label: 'Individual Dashboard', sub: 'Amina Hassan · UX Designer',        onClick: () => fillDemo('demo@trustnet.com', 'demo1234') },
              { href: '/business/dashboard', label: 'Business Portal',      sub: 'Simba Tech Solutions',              onClick: undefined },
              { href: '/admin',              label: 'Admin Panel',          sub: 'Platform management',               onClick: undefined },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color .15s, background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--forest-lt)'; e.currentTarget.style.background = 'var(--forest-pale)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
