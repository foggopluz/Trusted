'use client'
import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  userId: string
  onSuccess: () => void
}

const TYPES = [
  { value: 'employment',   label: 'Employment' },
  { value: 'payment',      label: 'Payment' },
  { value: 'endorsement',  label: 'Endorsement' },
  { value: 'skill',        label: 'Skill' },
]

export default function AddCredentialForm({ userId, onSuccess }: Props) {
  const [type, setType]             = useState('employment')
  const [description, setDesc]      = useState('')
  const [issuerName, setIssuerName] = useState('')
  const [issuerEmail, setIssuerEmail] = useState('')
  const [file, setFile]             = useState<File | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [done, setDone]             = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError('Please enter a description.'); return }
    if (!issuerName.trim())  { setError('Please enter the issuer name.'); return }

    setLoading(true)
    setError(null)

    try {
      let proofUrl: string | null = null

      // Upload proof file if provided
      if (file) {
        const { supabase } = await import('@/lib/supabase')
        const ext  = file.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('credential-proofs')
          .upload(path, file, { upsert: false })
        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)
        const { data: urlData } = supabase.storage.from('credential-proofs').getPublicUrl(path)
        proofUrl = urlData.publicUrl
      }

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:      userId,
          type,
          description:  description.trim(),
          issuer_name:  issuerName.trim(),
          issuer_email: issuerEmail.trim() || null,
          proof_url:    proofUrl,
          status:       'pending',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create credential.')
      }

      setDone(true)
      setType('employment'); setDesc(''); setIssuerName(''); setIssuerEmail(''); setFile(null)
      setTimeout(() => { setDone(false); onSuccess() }, 1400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Type */}
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

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          value={description}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          placeholder="Describe this credential…"
          style={{ resize: 'vertical' }}
          disabled={loading}
        />
      </div>

      {/* Issuer Name */}
      <div>
        <label className="label">Issuer Name</label>
        <input
          className="input"
          type="text"
          value={issuerName}
          onChange={e => setIssuerName(e.target.value)}
          placeholder="e.g. Simba Tech Solutions"
          disabled={loading}
        />
      </div>

      {/* Issuer Email */}
      <div>
        <label className="label">Issuer Email <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>(optional)</span></label>
        <input
          className="input"
          type="email"
          value={issuerEmail}
          onChange={e => setIssuerEmail(e.target.value)}
          placeholder="issuer@example.com"
          disabled={loading}
        />
      </div>

      {/* Upload Proof */}
      <div>
        <label className="label">Upload Proof <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>(optional)</span></label>
        <div
          onClick={() => !loading && fileRef.current?.click()}
          style={{
            border: '1.5px dashed var(--border)',
            borderRadius: 8,
            padding: '14px 16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)',
            transition: 'border-color .15s',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--forest-lt)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
        >
          <Upload style={{ width: 16, height: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: file ? 'var(--text-mid)' : 'var(--text-faint)' }}>
            {file ? file.name : 'Click to attach a file (PDF, image)'}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
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
        disabled={loading || done}
        style={{ alignSelf: 'flex-start', minWidth: 140 }}
      >
        {done ? (
          <><CheckCircle style={{ width: 15, height: 15 }} /> Saved!</>
        ) : loading ? (
          <><Loader2 style={{ width: 15, height: 15, animation: 'spin .7s linear infinite' }} /> Saving…</>
        ) : (
          'Submit Credential'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
