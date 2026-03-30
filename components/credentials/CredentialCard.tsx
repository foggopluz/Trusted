'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Briefcase, DollarSign, ThumbsUp, Shield, Award, AlertTriangle } from 'lucide-react'

export interface CredentialRow {
  id: string
  user_id: string
  issuer_id?: string | null
  issuer_name?: string | null
  issuer_email?: string | null
  type: 'employment' | 'payment' | 'endorsement' | 'identity' | 'skill'
  description?: string | null
  status: 'pending' | 'approved' | 'rejected'
  proof_url?: string | null
  created_at: string
}

interface Props {
  credential: CredentialRow
  currentUserId?: string
  isOwner?: boolean           // true when viewing own credentials
  onStatusChange?: (id: string, status: 'approved' | 'rejected') => void
}

const TYPE_CONFIG: Record<CredentialRow['type'], {
  label: string
  color: string
  bg: string
  Icon: React.ElementType
}> = {
  employment: {
    label: 'Employment',
    color: 'var(--gold)',
    bg: 'var(--gold-pale)',
    Icon: Briefcase,
  },
  payment: {
    label: 'Payment',
    color: 'var(--risk-low)',
    bg: 'var(--risk-low-bg)',
    Icon: DollarSign,
  },
  endorsement: {
    label: 'Endorsement',
    color: 'var(--forest-mid)',
    bg: 'var(--forest-pale)',
    Icon: ThumbsUp,
  },
  identity: {
    label: 'Identity',
    color: 'var(--text-muted)',
    bg: 'var(--surface-2)',
    Icon: Shield,
  },
  skill: {
    label: 'Skill',
    color: 'rgba(100,100,255,.9)',
    bg: 'rgba(100,100,255,.08)',
    Icon: Award,
  },
}

const STATUS_CONFIG: Record<CredentialRow['status'], { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: 'var(--risk-med)',  bg: 'var(--risk-med-bg)' },
  approved: { label: 'Approved', color: 'var(--risk-low)',  bg: 'var(--risk-low-bg)' },
  rejected: { label: 'Rejected', color: 'var(--risk-high)', bg: 'var(--risk-high-bg)' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CredentialCard({ credential, currentUserId, isOwner, onStatusChange }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason]     = useState('')
  const [disputeLoading, setDisputeLoading]   = useState(false)
  const [disputeDone, setDisputeDone]         = useState(false)
  const [disputeError, setDisputeError]       = useState<string | null>(null)

  const type = TYPE_CONFIG[credential.type] ?? TYPE_CONFIG.identity
  const status = STATUS_CONFIG[credential.status] ?? STATUS_CONFIG.pending
  const Icon = type.Icon

  const isIssuer = currentUserId && credential.issuer_id === currentUserId
  const canAct = isIssuer && credential.status === 'pending'

  async function handleDispute() {
    if (!disputeReason.trim()) return
    setDisputeLoading(true)
    setDisputeError(null)
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: credential.id, reason: disputeReason.trim() }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setDisputeError(error ?? 'Failed to file dispute')
        return
      }
      setDisputeDone(true)
      setShowDisputeForm(false)
    } catch {
      setDisputeError('Network error — please try again')
    } finally {
      setDisputeLoading(false)
    }
  }

  async function handleAction(action: 'approved' | 'rejected') {
    setLoading(action === 'approved' ? 'approve' : 'reject')
    try {
      const res = await fetch(`/api/credentials/${credential.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (!res.ok) throw new Error('Failed')
      onStatusChange?.(credential.id, action)
    } catch {
      // silently fail — parent can re-fetch
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: '18px 20px',
        borderLeft: `3px solid ${type.color}`,
        transition: 'box-shadow .18s',
      }}
    >
      {/* Top row: type badge + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Icon circle */}
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: type.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon style={{ width: 15, height: 15, color: type.color }} />
          </div>
          {/* Type badge */}
          <span
            className="badge"
            style={{ background: type.bg, color: type.color, fontSize: 10 }}
          >
            {type.label}
          </span>
        </div>

        {/* Status badge */}
        <span
          className="badge"
          style={{ background: status.bg, color: status.color, fontSize: 10 }}
        >
          {status.label}
        </span>
      </div>

      {/* Description */}
      {credential.description && (
        <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, margin: '0 0 6px', lineHeight: 1.5 }}>
          {credential.description}
        </p>
      )}

      {/* Issuer */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 2px' }}>
        <span style={{ color: 'var(--text-faint)' }}>Issued by: </span>
        <strong style={{ color: 'var(--text-mid)' }}>
          {credential.issuer_name ?? credential.issuer_email ?? 'Unknown'}
        </strong>
      </p>

      {/* Date */}
      <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock style={{ width: 11, height: 11 }} />
        {formatDate(credential.created_at)}
      </p>

      {/* Proof link */}
      {credential.proof_url && (
        <a
          href={credential.proof_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--forest-mid)', textDecoration: 'none', display: 'inline-block', marginTop: 6 }}
        >
          View proof →
        </a>
      )}

      {/* Approve / Reject buttons (issuer only, pending only) */}
      {canAct && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-lt)' }}>
          <button
            onClick={() => handleAction('approved')}
            disabled={loading !== null}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600,
              background: 'var(--risk-low-bg)', color: 'var(--risk-low)',
              border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity .15s',
            }}
          >
            {loading === 'approve' ? (
              <span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid var(--risk-low)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            ) : (
              <CheckCircle style={{ width: 13, height: 13 }} />
            )}
            Approve
          </button>

          <button
            onClick={() => handleAction('rejected')}
            disabled={loading !== null}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 600,
              background: 'var(--risk-high-bg)', color: 'var(--risk-high)',
              border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity .15s',
            }}
          >
            {loading === 'reject' ? (
              <span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid var(--risk-high)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            ) : (
              <XCircle style={{ width: 13, height: 13 }} />
            )}
            Reject
          </button>
        </div>
      )}

      {/* Dispute button — only for the credential's subject */}
      {isOwner && credential.status === 'approved' && !disputeDone && (
        <div style={{ marginTop: 12 }}>
          {!showDisputeForm ? (
            <button
              onClick={() => setShowDisputeForm(true)}
              style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
            >
              <AlertTriangle style={{ width: 11, height: 11 }} />
              Dispute this credential
            </button>
          ) : (
            <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Dispute this credential</p>
              <textarea
                rows={3}
                placeholder="Describe why this credential is incorrect…"
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                style={{ width: '100%', resize: 'vertical', fontSize: 13, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {disputeError && (
                <p style={{ fontSize: 12, color: 'var(--risk-high)', margin: '6px 0 0' }}>{disputeError}</p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleDispute}
                  disabled={disputeLoading || !disputeReason.trim()}
                  style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--risk-high)', color: '#fff', cursor: disputeLoading ? 'not-allowed' : 'pointer', opacity: disputeLoading || !disputeReason.trim() ? 0.6 : 1 }}
                >
                  {disputeLoading ? 'Filing…' : 'File dispute'}
                </button>
                <button
                  onClick={() => { setShowDisputeForm(false); setDisputeReason('') }}
                  style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-mid)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {disputeDone && (
        <p style={{ fontSize: 12, color: 'var(--risk-med)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangle style={{ width: 11, height: 11 }} />
          Dispute filed — under admin review
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
