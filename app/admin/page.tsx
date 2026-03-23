'use client'
import { useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import {
  users, companies, credentials, pendingVerifications,
  changeRequests, trustChecks,
} from '@/lib/store'
import { computeScore, getScoreLabel } from '@/lib/scoring'
import {
  CheckCircle, XCircle, Clock, Users, Building2, Shield,
  BarChart3, Sliders, AlertTriangle, Search, AlertCircle,
  FileEdit, UserX, UserCheck,
} from 'lucide-react'

type Tab = 'queue' | 'changes' | 'users' | 'analytics' | 'scoring'

const stats = [
  {
    label: 'Total Users',
    value: users.filter(u => u.role !== 'admin').length,
    icon: Users,
    color: 'var(--forest-mid)',
    bg: 'rgba(27,94,59,.1)',
  },
  {
    label: 'Verified Businesses',
    value: companies.filter(c => c.verificationStatus === 'verified').length,
    icon: Building2,
    color: 'var(--gold)',
    bg: 'var(--gold-pale)',
  },
  {
    label: 'Active Credentials',
    value: credentials.filter(c => c.status === 'active').length,
    icon: Shield,
    color: '#7C4FC4',
    bg: 'rgba(124,79,196,.1)',
  },
  {
    label: 'Pending Verifications',
    value: pendingVerifications.length,
    icon: Clock,
    color: 'var(--risk-med)',
    bg: 'var(--risk-med-bg)',
  },
]

const defaultWeights = { identity: 15, financial: 25, work_history: 25, endorsement: 15, skill: 10, reference: 10 }

const FIELD_LABELS: Record<string, string> = {
  business_name: 'Business Name',
  contact_phone: 'Contact Phone',
  contact_email: 'Contact Email',
  address: 'Address',
}

// ── Analytics helpers ────────────────────────────────────────────────────────

const nonAdminUsers = users.filter(u => u.role !== 'admin')

const byCountry = Object.entries(
  nonAdminUsers.reduce<Record<string, number>>((acc, u) => {
    acc[u.country] = (acc[u.country] ?? 0) + 1
    return acc
  }, {})
).sort((a, b) => b[1] - a[1])

const byCredType = Object.entries(
  credentials.reduce<Record<string, number>>((acc, c) => {
    acc[c.credentialType] = (acc[c.credentialType] ?? 0) + 1
    return acc
  }, {})
).sort((a, b) => b[1] - a[1])

const CRED_TYPE_LABELS: Record<string, string> = {
  identity: 'Identity',
  financial: 'Financial',
  work_history: 'Work History',
  endorsement: 'Endorsement',
  skill: 'Skill',
}

const trustCheckVolume = trustChecks.length
const trustCheckByStatus = {
  granted: trustChecks.filter(tc => tc.consentStatus === 'granted').length,
  pending: trustChecks.filter(tc => tc.consentStatus === 'pending').length,
  denied:  trustChecks.filter(tc => tc.consentStatus === 'denied').length,
}

const accountTypes = ['professional', 'job_seeker', 'business'] as const
const avgScoreByType = accountTypes.map(type => {
  const subset = nonAdminUsers.filter(u => u.accountType === type)
  if (subset.length === 0) return { type, avg: 0 }
  const avg = Math.round(subset.reduce((s, u) => s + u.trustScore, 0) / subset.length)
  return { type, avg }
})

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('queue')

  // Verification queue — each entry tracks decision + optional rejection note
  const [queue, setQueue] = useState(
    pendingVerifications.map(v => ({
      ...v,
      decision: null as null | 'approved' | 'rejected',
      note: '',
      showNoteInput: false,
    }))
  )

  // Change requests — local decision overlay
  const [changeDecisions, setChangeDecisions] = useState<Record<string, 'approved' | 'rejected'>>(
    Object.fromEntries(
      changeRequests
        .filter(cr => cr.status !== 'pending')
        .map(cr => [cr.id, cr.status as 'approved' | 'rejected'])
    )
  )

  // Scoring config
  const [weights, setWeights] = useState(defaultWeights)
  const [thresholds, setThresholds] = useState({ low: 700, medium: 450 })
  const [configSaved, setConfigSaved] = useState(false)

  function saveConfig() {
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 3000)
  }

  // Admin action helpers
  async function handleVerificationApprove(id: string, idx: number) {
    setQueue(q => q.map((x, i) => i === idx ? { ...x, decision: 'approved' as const, showNoteInput: false } : x))
    try {
      await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approved' }),
      })
    } catch { /* optimistic update already applied */ }
  }

  async function handleVerificationReject(id: string, note: string, idx: number) {
    setQueue(q => q.map((x, i) => i === idx ? { ...x, decision: 'rejected' as const, showNoteInput: false } : x))
    try {
      await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'rejected', note }),
      })
    } catch { /* optimistic update already applied */ }
  }

  async function handleChangeDecision(id: string, action: 'approved' | 'rejected') {
    setChangeDecisions(x => ({ ...x, [id]: action }))
    try {
      await fetch('/api/admin/changes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
    } catch { /* optimistic update already applied */ }
  }

  // User management
  const [userSearch, setUserSearch] = useState('')
  const [suspended, setSuspended] = useState<Set<string>>(new Set())

  const totalW = Object.values(weights).reduce((a, b) => a + b, 0)

  const filteredUsers = nonAdminUsers.filter(u =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase())
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'queue',    label: `Verification Queue (${pendingVerifications.length})` },
    { id: 'changes',  label: `Change Requests (${changeRequests.length})` },
    { id: 'users',    label: 'User Management' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'scoring',  label: 'Scoring Config' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Shield style={{ width: 20, height: 20, color: 'var(--forest-mid)' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
              Admin Panel
            </h1>
            <span className="badge" style={{ background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }}>Internal</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Platform oversight, verification queue, change requests and scoring configuration
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="card fade-up" style={{ padding: 20, animationDelay: `${i * 0.06}s` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <s.icon style={{ width: 16, height: 16, color: s.color }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="card fade-up fade-up-2" style={{ overflow: 'hidden' }}>
          <div className="tab-bar">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab-btn${tab === t.id ? ' active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* ── Verification Queue ── */}
            {tab === 'queue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {queue.map((v, idx) => (
                  <div key={v.id} style={{ border: '1px solid var(--border-lt)', borderRadius: 10, overflow: 'hidden', background: 'var(--white)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: v.type === 'individual' ? 'rgba(27,94,59,.1)' : 'var(--gold-pale)',
                        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                        color: v.type === 'individual' ? 'var(--forest-mid)' : 'var(--gold)',
                      }}>
                        {v.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{v.name}</span>
                          <span className="badge badge-forest" style={{ textTransform: 'capitalize' }}>{v.type}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{v.document}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>
                          Submitted {new Date(v.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Status / Actions */}
                      {v.decision ? (
                        <span className="badge" style={v.decision === 'approved'
                          ? { background: 'var(--risk-low-bg)', color: 'var(--risk-low)', display: 'flex', alignItems: 'center', gap: 4 }
                          : { background: 'var(--risk-high-bg)', color: 'var(--risk-high)', display: 'flex', alignItems: 'center', gap: 4 }
                        }>
                          {v.decision === 'approved'
                            ? <><CheckCircle style={{ width: 13, height: 13 }} /> Approved</>
                            : <><XCircle style={{ width: 13, height: 13 }} /> Rejected</>
                          }
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setQueue(q => q.map((x, i) => i === idx ? { ...x, showNoteInput: true } : x))}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--white)', color: 'var(--risk-high)', border: '1.5px solid var(--risk-high)', borderRadius: 7, padding: '6px 13px', cursor: 'pointer' }}
                          >
                            <XCircle style={{ width: 13, height: 13 }} /> Reject with Note
                          </button>
                          <button
                            onClick={() => handleVerificationApprove(v.id, idx)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--risk-low-bg)', color: 'var(--risk-low)', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer' }}
                          >
                            <CheckCircle style={{ width: 13, height: 13 }} /> Approve
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Rejection note input — shown after "Reject with Note" is clicked */}
                    {v.showNoteInput && !v.decision && (
                      <div style={{ borderTop: '1px solid var(--border-lt)', padding: '12px 16px', background: 'var(--risk-high-bg)' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--risk-high)', display: 'block', marginBottom: 6 }}>
                          Rejection note (required)
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            className="input"
                            style={{ flex: 1, fontSize: 13 }}
                            placeholder="Explain why this submission is being rejected…"
                            value={v.note}
                            onChange={e => setQueue(q => q.map((x, i) => i === idx ? { ...x, note: e.target.value } : x))}
                          />
                          <button
                            disabled={!v.note.trim()}
                            onClick={() => handleVerificationReject(v.id, v.note, idx)}
                            style={{ fontSize: 12, fontWeight: 600, background: v.note.trim() ? 'var(--risk-high)' : 'var(--border)', color: v.note.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 7, padding: '7px 16px', cursor: v.note.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setQueue(q => q.map((x, i) => i === idx ? { ...x, showNoteInput: false, note: '' } : x))}
                            style={{ fontSize: 12, background: 'none', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', padding: '7px 8px' }}
                          >
                            Cancel
                          </button>
                        </div>
                        {v.decision === null && v.note.trim() === '' && (
                          <p style={{ fontSize: 11, color: 'var(--risk-high)', marginTop: 4 }}>A note is required before confirming rejection.</p>
                        )}
                      </div>
                    )}

                    {/* Show saved rejection note */}
                    {v.decision === 'rejected' && v.note && (
                      <div style={{ borderTop: '1px solid var(--border-lt)', padding: '10px 16px', background: 'var(--risk-high-bg)' }}>
                        <span style={{ fontSize: 12, color: 'var(--risk-high)', fontWeight: 500 }}>Note: </span>
                        <span style={{ fontSize: 12, color: 'var(--text-mid)', fontStyle: 'italic' }}>{v.note}</span>
                      </div>
                    )}
                  </div>
                ))}
                {queue.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    <CheckCircle style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>No pending verifications</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Change Requests ── */}
            {tab === 'changes' && (
              <div>
                <div style={{ display: 'flex', gap: 10, padding: '13px 16px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', marginBottom: 20, fontSize: 13, color: 'var(--text-mid)' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
                  <span>
                    <strong>Businesses cannot change their name or contact details directly</strong> — all changes go through this queue and require admin approval before taking effect on the platform.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {changeRequests.map(cr => {
                    const decision = changeDecisions[cr.id]
                    const isPending = cr.status === 'pending' && !decision

                    return (
                      <div key={cr.id} style={{ border: '1px solid var(--border-lt)', borderRadius: 10, overflow: 'hidden', background: 'var(--white)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(124,79,196,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileEdit style={{ width: 16, height: 16, color: '#7C4FC4' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{cr.companyName}</span>
                              <span className="badge" style={{ background: 'rgba(124,79,196,.1)', color: '#7C4FC4' }}>
                                {FIELD_LABELS[cr.field] ?? cr.field}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                              Requested by user <code style={{ fontSize: 11 }}>{cr.requestedBy}</code>
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <div style={{ fontSize: 12 }}>
                                <span style={{ color: 'var(--text-faint)' }}>Current: </span>
                                <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}>{cr.currentValue}</span>
                              </div>
                              <div style={{ fontSize: 12 }}>
                                <span style={{ color: 'var(--text-faint)' }}>Requested: </span>
                                <span style={{ color: 'var(--forest-mid)', fontWeight: 600 }}>{cr.requestedValue}</span>
                              </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 4 }}>
                              "{cr.reason}"
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                              Submitted {new Date(cr.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {cr.resolvedAt && ` · Resolved ${new Date(cr.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                            </p>
                          </div>
                          {isPending ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => handleChangeDecision(cr.id, 'rejected')}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--risk-high-bg)', color: 'var(--risk-high)', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer' }}
                              >
                                <XCircle style={{ width: 13, height: 13 }} /> Reject
                              </button>
                              <button
                                onClick={() => handleChangeDecision(cr.id, 'approved')}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--risk-low-bg)', color: 'var(--risk-low)', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer' }}
                              >
                                <CheckCircle style={{ width: 13, height: 13 }} /> Approve
                              </button>
                            </div>
                          ) : (
                            <span
                              className="badge"
                              style={
                                (decision ?? cr.status) === 'approved'
                                  ? { background: 'var(--risk-low-bg)', color: 'var(--risk-low)', display: 'flex', alignItems: 'center', gap: 4 }
                                  : { background: 'var(--risk-high-bg)', color: 'var(--risk-high)', display: 'flex', alignItems: 'center', gap: 4 }
                              }
                            >
                              {(decision ?? cr.status) === 'approved'
                                ? <><CheckCircle style={{ width: 12, height: 12 }} /> Approved</>
                                : <><XCircle style={{ width: 12, height: 12 }} /> Rejected</>
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {changeRequests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                      <FileEdit style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 14 }}>No change requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── User Management ── */}
            {tab === 'users' && (
              <div>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <Search style={{ width: 15, height: 15, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search users…"
                    className="input"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-lt)' }}>
                        {['Name', 'Account Type', 'Country', 'Verified', 'Trust Score', 'Member Since', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0 12px 12px 0', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => {
                        const score = computeScore(credentials.filter(c => c.subjectUserId === user.id))
                        const { label: scoreLabel } = getScoreLabel(score.score)
                        const scoreColor = score.score >= 700 ? 'var(--risk-low)' : score.score >= 450 ? 'var(--risk-med)' : 'var(--risk-high)'
                        const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)
                        const isSuspended = suspended.has(user.id)
                        return (
                          <tr key={user.id} style={{ borderBottom: '1px solid var(--border-lt)', opacity: isSuspended ? 0.55 : 1 }}>
                            {/* Name */}
                            <td style={{ padding: '12px 12px 12px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSuspended ? 'var(--border)' : 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--gold-lt)', flexShrink: 0 }}>
                                  {initials}
                                </div>
                                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{user.fullName}</span>
                              </div>
                            </td>
                            {/* Account Type */}
                            <td style={{ padding: '12px 12px 12px 0' }}>
                              <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                                {user.accountType.replace('_', ' ')}
                              </span>
                            </td>
                            {/* Country */}
                            <td style={{ padding: '12px 12px 12px 0', color: 'var(--text-muted)' }}>{user.country}</td>
                            {/* Verified */}
                            <td style={{ padding: '12px 12px 12px 0' }}>
                              <span className="badge" style={
                                user.idVerificationStatus === 'verified' ? { background: 'var(--risk-low-bg)', color: 'var(--risk-low)' } :
                                user.idVerificationStatus === 'pending'  ? { background: 'var(--risk-med-bg)', color: 'var(--risk-med)' } :
                                { background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }
                              }>
                                {user.idVerificationStatus}
                              </span>
                            </td>
                            {/* Trust Score */}
                            <td style={{ padding: '12px 12px 12px 0' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: scoreColor }}>{score.score}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 4 }}>{scoreLabel}</span>
                            </td>
                            {/* Member Since */}
                            <td style={{ padding: '12px 12px 12px 0', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{user.memberSince}</td>
                            {/* Actions */}
                            <td style={{ padding: '12px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Link
                                  href={`/profile/${user.id}`}
                                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--forest-mid)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}
                                >
                                  View Profile
                                </Link>
                                <button
                                  onClick={() => setSuspended(s => {
                                    const next = new Set(s)
                                    if (next.has(user.id)) next.delete(user.id)
                                    else next.add(user.id)
                                    return next
                                  })}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: isSuspended ? 'var(--risk-low-bg)' : 'var(--risk-high-bg)', color: isSuspended ? 'var(--risk-low)' : 'var(--risk-high)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                  {isSuspended
                                    ? <><UserCheck style={{ width: 12, height: 12 }} /> Reinstate</>
                                    : <><UserX style={{ width: 12, height: 12 }} /> Suspend</>
                                  }
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>No users match your search.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── Analytics ── */}
            {tab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Row 1: Registrations by country + Credentials by type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                  {/* Registrations by country */}
                  <div style={{ borderRadius: 12, padding: 20, border: '1px solid var(--border)', background: 'var(--white)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>
                      <BarChart3 style={{ width: 15, height: 15, color: 'var(--forest-mid)' }} />
                      Registrations by Country
                    </h3>
                    {byCountry.map(([country, count]) => (
                      <div key={country} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{country}</span>
                        <div style={{ flex: 1, height: 18, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.max((count / nonAdminUsers.length) * 100, 8)}%`, background: 'var(--forest-mid)', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 7 }}>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Credentials issued by type */}
                  <div style={{ borderRadius: 12, padding: 20, border: '1px solid var(--border)', background: 'var(--white)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>
                      <Shield style={{ width: 15, height: 15, color: '#7C4FC4' }} />
                      Credentials Issued by Type
                    </h3>
                    {byCredType.map(([type, count]) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{CRED_TYPE_LABELS[type] ?? type}</span>
                        <div style={{ flex: 1, height: 18, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.max((count / credentials.length) * 100, 8)}%`, background: '#7C4FC4', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 7 }}>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 2: Trust check volume + Avg score by account type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                  {/* Trust check volume */}
                  <div style={{ borderRadius: 12, padding: 20, border: '1px solid var(--border)', background: 'var(--white)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>
                      Trust Check Volume
                    </h3>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, color: 'var(--forest-mid)', marginBottom: 16 }}>
                      {trustCheckVolume}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { label: 'Consent granted', count: trustCheckByStatus.granted, color: 'var(--risk-low)' },
                        { label: 'Awaiting consent', count: trustCheckByStatus.pending, color: 'var(--risk-med)' },
                        { label: 'Consent denied',   count: trustCheckByStatus.denied,  color: 'var(--risk-high)' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border-lt)', padding: '9px 0' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, display: 'inline-block' }} />
                            {row.label}
                          </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)' }}>{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Average score by account type */}
                  <div style={{ borderRadius: 12, padding: 20, border: '1px solid var(--border)', background: 'var(--white)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>
                      Avg. Trust Score by Account Type
                    </h3>
                    {avgScoreByType.map(({ type, avg }) => {
                      const color = avg >= 700 ? 'var(--risk-low)' : avg >= 450 ? 'var(--risk-med)' : 'var(--risk-high)'
                      const { label: scoreLabel } = getScoreLabel(avg)
                      return (
                        <div key={type} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color }}>{avg} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-faint)' }}>{scoreLabel}</span></span>
                          </div>
                          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(avg / 1000) * 100}%`, background: color, borderRadius: 99 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Scoring Config ── */}
            {tab === 'scoring' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sliders style={{ width: 16, height: 16, color: 'var(--forest-mid)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                    Scoring Factor Weights
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Adjust how much each credential type contributes to the final trust score. Must total 100%.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                  {(Object.entries(weights) as [keyof typeof weights, number][]).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--forest-mid)' }}>{val}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={val}
                        onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: 'var(--forest-mid)' }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, background: totalW === 100 ? 'var(--risk-low-bg)' : 'var(--risk-med-bg)', fontSize: 13, marginBottom: 24 }}>
                  {totalW === 100
                    ? <CheckCircle style={{ width: 16, height: 16, color: 'var(--risk-low)' }} />
                    : <AlertTriangle style={{ width: 16, height: 16, color: 'var(--risk-med)' }} />
                  }
                  <span style={{ color: totalW === 100 ? 'var(--risk-low)' : 'var(--risk-med)', fontWeight: 500 }}>
                    Total: <strong>{totalW}%</strong>{totalW !== 100 ? ' — must equal 100%' : ' — ready to save'}
                  </span>
                </div>

                {/* Provenance weight reference table */}
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 12 }}>Provenance Weight Reference</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Read-only. These weights are applied per-credential based on issuer type.</p>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 28 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-lt)' }}>
                      {['Institution Type', 'Provenance Weight'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0 12px 10px 0', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Central Bank / Government', weight: '1.00 (100%)' },
                      { label: 'Commercial Bank',           weight: '0.95 (95%)' },
                      { label: 'Microfinance Institution',  weight: '0.80 (80%)' },
                      { label: 'Credit Union / SACCO',      weight: '0.70 (70%)' },
                      { label: 'Insurance Company',         weight: '0.65 (65%)' },
                      { label: 'Mobile Money Provider',     weight: '0.60 (60%)' },
                      { label: 'Admin-Issued (identity/skill)', weight: '0.98 (98%)' },
                      { label: 'Business-Issued',           weight: '0.85 (85%)' },
                      { label: 'Peer Endorsement',          weight: '0.70 (70%)' },
                    ].map(row => (
                      <tr key={row.label} style={{ borderBottom: '1px solid var(--border-lt)' }}>
                        <td style={{ padding: '10px 12px 10px 0', color: 'var(--text-mid)' }}>{row.label}</td>
                        <td style={{ padding: '10px 0', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--forest-mid)' }}>{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>Risk Tier Thresholds</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  {[
                    { key: 'low' as const,    label: 'Low Risk — min score',    color: 'var(--risk-low)',  accent: 'var(--forest-mid)' },
                    { key: 'medium' as const, label: 'Medium Risk — min score', color: 'var(--risk-med)',  accent: 'var(--gold)' },
                  ].map(({ key, label, color, accent }) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color }}>{thresholds[key]}</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={900}
                        value={thresholds[key]}
                        onChange={e => setThresholds(t => ({ ...t, [key]: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: accent }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button
                    disabled={totalW !== 100}
                    onClick={saveConfig}
                    style={{ padding: '11px 28px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: totalW === 100 ? 'pointer' : 'not-allowed', background: totalW === 100 ? 'var(--forest)' : 'var(--border)', color: totalW === 100 ? 'var(--gold-lt)' : 'var(--text-muted)', transition: 'background .2s' }}
                  >
                    Save Configuration
                  </button>
                  {configSaved && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--risk-low)', fontWeight: 500 }}>
                      <CheckCircle style={{ width: 15, height: 15 }} />
                      Configuration saved
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
