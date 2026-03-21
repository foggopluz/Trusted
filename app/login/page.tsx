'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (authError) {
        setError(authError.message)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 36 }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'none' }}>Create an account →</Link>
          </p>

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
                <Link href="#" style={{ fontSize: 13, color: 'var(--forest-mid)', textDecoration: 'none' }}>Forgot password?</Link>
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
              <p style={{ fontSize: 13, color: 'var(--risk-high)', marginBottom: 16, padding: '10px 14px', background: 'var(--risk-high-bg)', borderRadius: 8 }}>
                {error}
              </p>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, cursor: 'pointer' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Quick access */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Quick demo access</p>
            {[
              { href: '/dashboard', label: 'Individual Dashboard', sub: 'Amina Hassan · UX Designer' },
              { href: '/business/dashboard', label: 'Business Portal', sub: 'Simba Tech Solutions' },
              { href: '/admin', label: 'Admin Panel', sub: 'Platform management' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color .15s' }}
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
