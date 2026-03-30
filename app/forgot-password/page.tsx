'use client'
import { useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { createSupabaseBrowserClient, IS_DEMO_MODE } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError(null)

    if (IS_DEMO_MODE) {
      // Demo mode: just show success without sending anything
      setSubmitted(true)
      setLoading(false)
      return
    }

    const client = createSupabaseBrowserClient()
    const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSubmitted(true)
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>

            {submitted ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(27,94,59,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--forest-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Check your email</h2>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: 24 }}>
                  If <strong>{email}</strong> is registered with TrustNet, you will receive a password reset link shortly.
                </p>
                <Link href="/login" style={{ fontSize: 14, color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'none' }}>
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Reset your password</h1>
                  <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 20 }}>
                    <label className="label">Email address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  Remember your password?{' '}
                  <Link href="/login" style={{ color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
