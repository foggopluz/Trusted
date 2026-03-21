'use client'
import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

interface Props {
  userId: string
  onSuccess: () => void
}

const TYPES = [
  { value: 'employment',   label: 'Employment' },
  { value: 'payment',      label: 'Payment' },
  { value: 'endorsement',  label: 'Endorsement' },
  { value: 'skill',        label: 'Skill' },
  { value: 'identity',     label: 'Identity' },
]

export default function RequestCredentialForm({ userId, onSuccess }: Props) {
  const [issuerEmail, setIssuerEmail] = useState('')
  const [type, setType]               = useState('employment')
  const [description, setDesc]        = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [sent, setSent]               = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issuerEmail.trim()) { setError('Please enter the issuer email.'); return }
    if (!description.trim()) { setError('Please enter a message or description.'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:      userId,
          type,
          description:  description.trim(),
          issuer_email: issuerEmail.trim(),
          issuer_name:  null,
          status:       'pending',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to send request.')
      }

      setSent(true)
      setIssuerEmail(''); setDesc('')
      setTimeout(() => { setSent(false); onSuccess() }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, padding: '32px 0', textAlign: 'center',
      }}>
        <CheckCircle style={{ width: 40, height: 40, color: 'var(--risk-low)' }} />
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: 0 }}>
          Request sent!
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          The issuer will receive a notification and can approve your request.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Issuer Email */}
      <div>
        <label className="label">Issuer Email</label>
        <input
          className="input"
          type="email"
          value={issuerEmail}
          onChange={e => setIssuerEmail(e.target.value)}
          placeholder="colleague@company.com"
          disabled={loading}
          required
        />
        <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '4px 0 0' }}>
          The person who will verify and approve this credential.
        </p>
      </div>

      {/* Credential Type */}
      <div>
        <label className="label">Credential Type</label>
        <select
          className="select"
          value={type}
          onChange={e => setType(e.target.value)}
          disabled={loading}
        >
          {TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Message / Description */}
      <div>
        <label className="label">Message / Description</label>
        <textarea
          className="input"
          value={description}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          placeholder="e.g. Please verify my employment at Simba Tech from Jan 2023 to Mar 2024 as Senior Designer."
          style={{ resize: 'vertical' }}
          disabled={loading}
          required
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: 'var(--risk-high)', margin: 0, padding: '8px 12px', background: 'var(--risk-high-bg)', borderRadius: 7 }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-forest"
        disabled={loading}
        style={{ alignSelf: 'flex-start', minWidth: 160 }}
      >
        {loading ? (
          <><Loader2 style={{ width: 15, height: 15, animation: 'spin .7s linear infinite' }} /> Sending…</>
        ) : (
          'Send Request'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
