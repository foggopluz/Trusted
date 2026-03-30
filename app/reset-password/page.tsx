'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the user to this page with a hash fragment containing
  // the access token. The client SDK exchanges it automatically on mount.
  useEffect(() => {
    const client = createSupabaseBrowserClient()
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const client = createSupabaseBrowserClient()
    const { error: updateError } = await client.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (!sessionReady) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--bg)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-mid)', fontSize: 15 }}>
            Verifying reset link…
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>

            {done ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(27,94,59,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--forest-mid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Password updated</h2>
                <p style={{ fontSize: 14, color: 'var(--text-mid)' }}>Redirecting you to your dashboard…</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Choose a new password</h1>
                  <p style={{ fontSize: 14, color: 'var(--text-mid)' }}>Must be at least 8 characters.</p>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">New password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label className="label">Confirm new password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Updating…' : 'Update password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
