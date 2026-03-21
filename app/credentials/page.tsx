'use client'
import { useState } from 'react'
import Nav from '@/app/components/Nav'
import AddCredentialForm from '@/app/components/credentials/AddCredentialForm'
import RequestCredentialForm from '@/app/components/credentials/RequestCredentialForm'
import CredentialCard from '@/app/components/credentials/CredentialCard'
import { credentials as demoCredentials, users, financialInstitutions } from '@/lib/store'
import type { CredentialRow } from '@/app/components/credentials/CredentialCard'
import { PlusCircle, Send, Award } from 'lucide-react'

const demoUser = users.find(u => u.id === 'u-1')!

// Map store Credential → CredentialRow shape expected by CredentialCard
const TYPE_MAP: Record<string, CredentialRow['type']> = {
  identity:     'identity',
  work_history: 'employment',
  financial:    'payment',
  endorsement:  'endorsement',
  skill:        'skill',
}

const demoCreds: CredentialRow[] = demoCredentials
  .filter(c => c.subjectUserId === 'u-1')
  .map(c => {
    const inst = financialInstitutions.find(i => i.id === c.issuerInstitutionId)
    return {
      id:           c.id,
      user_id:      c.subjectUserId,
      issuer_id:    c.issuerUserId ?? null,
      issuer_name:  inst?.name ?? c.issuerUserId ?? null,
      issuer_email: null,
      type:         TYPE_MAP[c.credentialType] ?? 'identity',
      description:  c.credentialType.replace('_', ' ') + ' credential',
      status:       c.status === 'active' ? 'approved' : c.status === 'revoked' ? 'rejected' : 'pending',
      proof_url:    null,
      created_at:   c.issuedAt,
    }
  })

export default function CredentialsPage() {
  const [showAdd, setShowAdd]         = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [refresh, setRefresh]         = useState(0)

  function onSuccess() { setShowAdd(false); setShowRequest(false); setRefresh(r => r + 1) }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', paddingTop: 64 }}>
      <Nav />

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Award style={{ width: 22, height: 22, color: 'var(--gold)' }} />
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
                  My Credentials
                </h1>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Showing demo data for {demoUser.fullName} · {demoCreds.length} credentials on record
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline-dark btn-sm"
                onClick={() => { setShowRequest(s => !s); setShowAdd(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send style={{ width: 14, height: 14 }} /> Request Credential
              </button>
              <button
                className="btn btn-forest btn-sm"
                onClick={() => { setShowAdd(s => !s); setShowRequest(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <PlusCircle style={{ width: 14, height: 14 }} /> Add Credential
              </button>
            </div>
          </div>

          {/* Inline forms */}
          <div style={{
            maxHeight: showAdd ? 600 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {showAdd && (
              <div className="card" style={{ marginTop: 24, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>Add a New Credential</h3>
                <AddCredentialForm userId="u-1" onSuccess={onSuccess} />
              </div>
            )}
          </div>

          <div style={{
            maxHeight: showRequest ? 400 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {showRequest && (
              <div className="card" style={{ marginTop: 24, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>Request a Credential</h3>
                <RequestCredentialForm userId="u-1" onSuccess={onSuccess} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credential list */}
      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px' }}>
        {demoCreds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <Award style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.25 }} />
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 8 }}>No credentials yet</p>
            <p style={{ fontSize: 14 }}>Add your first credential to start building your trust score.</p>
            <button className="btn btn-forest" style={{ marginTop: 20 }} onClick={() => setShowAdd(true)}>
              <PlusCircle style={{ width: 15, height: 15 }} /> Add Credential
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {demoCreds.map(c => (
              <CredentialCard key={c.id} credential={c} currentUserId="u-1" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
