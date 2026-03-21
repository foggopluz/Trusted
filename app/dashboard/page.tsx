'use client'
import { useState } from 'react'
import Link from 'next/link'
import Nav from '@/app/components/Nav'
import ScoreRing from '@/app/components/ScoreRing'
import { users, credentials, trustChecks, companies, financialInstitutions } from '@/lib/store'
import { computeScore } from '@/lib/scoring'
import { INSTITUTION_LABELS } from '@/lib/types'
import {
  Shield, Briefcase, ThumbsUp, DollarSign, Award,
  Clock, CheckCircle, XCircle, Share2, Search, PlusCircle,
} from 'lucide-react'

const USER_ID = 'u-1'

const CRED_ICON: Record<string, React.ElementType> = {
  identity: Shield,
  financial: DollarSign,
  work_history: Briefcase,
  endorsement: ThumbsUp,
  skill: Award,
}

const CRED_ACCENT: Record<string, string> = {
  identity: 'var(--forest-mid)',
  financial: 'var(--gold)',
  work_history: '#7C4FC4',
  endorsement: '#C07A0A',
  skill: '#B83232',
}

const CRED_BG: Record<string, string> = {
  identity: 'rgba(27,94,59,.1)',
  financial: 'var(--gold-pale)',
  work_history: 'rgba(124,79,196,.1)',
  endorsement: 'rgba(192,122,10,.1)',
  skill: 'rgba(184,50,50,.1)',
}

const CRED_LABEL: Record<string, string> = {
  identity: 'Identity',
  financial: 'Financial',
  work_history: 'Work History',
  endorsement: 'Endorsement',
  skill: 'Skill',
}

function timeAgo(d: string) {
  const mo = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30))
  return mo < 1 ? '< 1 month ago' : mo === 1 ? '1 month ago' : `${mo} months ago`
}

function truncateDid(did: string) {
  if (did.length <= 24) return did
  return did.slice(0, 14) + '…' + did.slice(-8)
}

export default function DashboardPage() {
  const user = users.find(u => u.id === USER_ID)!
  const userCreds = credentials.filter(c => c.subjectUserId === USER_ID)
  const scoreResult = computeScore(userCreds)
  const userTrustChecks = trustChecks.filter(tc => tc.subjectUserId === USER_ID)

  const [tab, setTab] = useState<'wallet' | 'checks' | 'profile'>('wallet')
  const [didCopied, setDidCopied] = useState(false)
  const [trustCheckModal, setTrustCheckModal] = useState(false)
  const [trustCheckSent, setTrustCheckSent] = useState(false)
  const [trustCheckTarget, setTrustCheckTarget] = useState('')

  function submitTrustCheck() {
    if (!trustCheckTarget.trim()) return
    setTrustCheckSent(true)
    setTimeout(() => { setTrustCheckModal(false); setTrustCheckSent(false); setTrustCheckTarget('') }, 1800)
  }

  function copyDid() {
    navigator.clipboard.writeText(user.did).catch(() => undefined)
    setDidCopied(true)
    setTimeout(() => setDidCopied(false), 2000)
  }

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)

  const tabs = [
    { id: 'wallet' as const, label: 'Trust Wallet' },
    { id: 'checks' as const, label: 'Consent Requests' },
    { id: 'profile' as const, label: 'My Profile' },
  ]

  const pendingCount = userTrustChecks.filter(tc => tc.consentStatus === 'pending').length

  const breakdown = [
    { label: 'Identity Verification', value: scoreResult.breakdown.identity,           max: 150,  color: 'var(--forest-mid)' },
    { label: 'Financial History',      value: scoreResult.breakdown.financial,           max: 250,  color: 'var(--gold)' },
    { label: 'Work Contracts',         value: scoreResult.breakdown.contractPerformance, max: 250,  color: '#7C4FC4' },
    { label: 'Network Endorsements',   value: scoreResult.breakdown.networkTrust,        max: 200,  color: '#C07A0A' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32 }}>
          {/* Avatar — dark bg, gold border */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--dark)',
            border: '2px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold-lt)',
            flexShrink: 0,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            {/* Name + verified badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                {user.fullName}
              </h1>
              {user.idVerificationStatus === 'verified' && (
                <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle style={{ width: 12, height: 12 }} /> Verified
                </span>
              )}
            </div>

            {/* Profession · Location */}
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              {user.profession} · {user.location}, {user.country}
            </p>

            {/* Member since */}
            <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 4px' }}>
              Member since {user.memberSince}
            </p>

            {/* DID chip — truncated, monospace, copy-on-click */}
            <button
              onClick={copyDid}
              title={didCopied ? 'Copied!' : `Copy DID: ${user.did}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'monospace', fontSize: 11,
                color: didCopied ? 'var(--forest-mid)' : 'var(--text-faint)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-lt)',
                borderRadius: 6, padding: '3px 8px',
                cursor: 'pointer',
                transition: 'color .15s, border-color .15s',
              }}
            >
              {didCopied ? '✓ Copied' : truncateDid(user.did)}
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 24, alignItems: 'start' }}>

          {/* Left sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score card */}
            <div className="card fade-up fade-up-1" style={{ padding: 24, borderTop: '3px solid var(--forest-mid)', position: 'relative' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>
                Trust Score
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ScoreRing
                  score={scoreResult.score}
                  riskTier={scoreResult.riskTier}
                  confidence={scoreResult.confidence}
                  size={160}
                />
              </div>

              {/* Breakdown bars */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-lt)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Breakdown
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {breakdown.map(item => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-mid)' }}>{item.label}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: item.color }}>
                          {item.value}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-sm fade-up fade-up-2" style={{ padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                Quick Actions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Share My Profile → /profile/u-1 */}
                <Link
                  href="/profile/u-1"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    fontSize: 13, fontWeight: 500, color: 'var(--text-mid)',
                    textDecoration: 'none',
                  }}
                >
                  <Share2 style={{ width: 15, height: 15, color: 'var(--forest-mid)' }} />
                  Share My Profile
                </Link>

                {/* Request Trust Check */}
                <button
                  onClick={() => setTrustCheckModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    fontSize: 13, fontWeight: 500, color: 'var(--text-mid)', cursor: 'pointer',
                  }}
                >
                  <Search style={{ width: 15, height: 15, color: 'var(--gold)' }} />
                  Request Trust Check
                </button>

                {/* Add Credential */}
                <Link
                  href="/credentials"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    fontSize: 13, fontWeight: 500, color: 'var(--text-mid)',
                    textDecoration: 'none',
                  }}
                >
                  <PlusCircle style={{ width: 15, height: 15, color: '#7C4FC4' }} />
                  Add Credential
                </Link>
              </div>
            </div>
          </div>

          {/* Right main area */}
          <div className="card fade-up fade-up-2" style={{ overflow: 'hidden' }}>
            {/* Tab bar */}
            <div className="tab-bar">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`tab-btn${tab === t.id ? ' active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {t.label}
                  {t.id === 'checks' && pendingCount > 0 && (
                    <span style={{ background: 'var(--risk-high)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '1px 6px' }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {tab === 'wallet' && (
                <WalletTab userCreds={userCreds} />
              )}
              {tab === 'checks' && (
                <ChecksTab trustChecks={userTrustChecks} />
              )}
              {tab === 'profile' && (
                <ProfileTab user={user} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Trust Check Modal */}
      {trustCheckModal && (
        <div
          onClick={() => { if (!trustCheckSent) setTrustCheckModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: '100%', maxWidth: 440, padding: 32, borderRadius: 16 }}
          >
            {trustCheckSent ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircle style={{ width: 40, height: 40, color: 'var(--risk-low)', margin: '0 auto 14px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Request sent!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>The business will be notified to request your consent before viewing your score.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Search style={{ width: 18, height: 18, color: 'var(--gold)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', margin: 0 }}>Request Trust Check</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  Enter a business name or ID to initiate a trust check request. They'll receive a notification to view your score with your consent.
                </p>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Business Name or ID</label>
                  <input
                    className="input"
                    placeholder="e.g. Savanna Tech Ltd or biz-001"
                    value={trustCheckTarget}
                    onChange={e => setTrustCheckTarget(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitTrustCheck()}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-gold" onClick={submitTrustCheck} disabled={!trustCheckTarget.trim()} style={{ flex: 1, opacity: trustCheckTarget.trim() ? 1 : 0.5 }}>
                    Send Request
                  </button>
                  <button className="btn btn-outline-dark" onClick={() => setTrustCheckModal(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WalletTab({ userCreds }: { userCreds: typeof credentials }) {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'identity', 'financial', 'work_history', 'endorsement', 'skill']
  const filtered = filter === 'all' ? userCreds : userCreds.filter(c => c.credentialType === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
          Credentials <span style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 400 }}>({userCreds.length})</span>
        </h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                border: 'none', cursor: 'pointer', letterSpacing: '.03em',
                background: filter === f ? 'var(--forest)' : 'var(--surface-2)',
                color: filter === f ? 'var(--gold-lt)' : 'var(--text-muted)',
              }}
            >
              {f === 'all' ? 'All' : CRED_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(cred => {
          const Icon = CRED_ICON[cred.credentialType] ?? Shield
          const inst = cred.issuerInstitutionId
            ? financialInstitutions.find(f => f.id === cred.issuerInstitutionId)
            : null
          const issuerName = inst
            ? inst.name
            : cred.issuerUserId === 'u-admin'
              ? 'TrustNet'
              : cred.issuerCompanyId
                ? (companies.find(c => c.id === cred.issuerCompanyId)?.businessName ?? 'Unknown')
                : cred.issuerUserId
                  ? (users.find(u => u.id === cred.issuerUserId)?.fullName ?? 'Peer')
                  : 'Unknown'
          const accent = CRED_ACCENT[cred.credentialType]
          const bg = CRED_BG[cred.credentialType]
          const provenance = inst
            ? inst.provenanceWeight
            : cred.issuerUserId === 'u-admin'
              ? 0.98
              : cred.issuerCompanyId
                ? 0.85
                : 0.70

          return (
            <div
              key={cred.id}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-lt)', background: 'var(--white)' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 16, height: 16, color: accent }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{cred.title}</span>
                  <span className="badge" style={{ background: CRED_BG[cred.credentialType], color: accent, fontSize: 10 }}>
                    {CRED_LABEL[cred.credentialType]}
                  </span>
                  <span className="badge" style={{
                    background: cred.status === 'active' ? 'var(--risk-low-bg)' : 'var(--surface-2)',
                    color: cred.status === 'active' ? 'var(--risk-low)' : 'var(--text-muted)',
                    fontSize: 10,
                  }}>
                    {cred.status}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0' }}>
                  <strong style={{ color: 'var(--text-mid)' }}>{issuerName}</strong>
                  {inst && <> · {INSTITUTION_LABELS[inst.type]}</>}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    Issued {timeAgo(cred.issuedAt)}
                  </span>
                  {cred.expiresAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      Expires {timeAgo(cred.expiresAt)}
                    </span>
                  )}
                  <span>
                    <strong style={{ color: accent }}>{(cred.confidence * 100).toFixed(0)}%</strong> confidence
                  </span>
                  <span>
                    <strong style={{ color: 'var(--gold)' }}>{(provenance * 100).toFixed(0)}%</strong> provenance
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="progress-track" style={{ marginTop: 8 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${cred.confidence * 100}%`, background: accent }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Shield style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No credentials in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChecksTab({ trustChecks: checks }: { trustChecks: typeof trustChecks }) {
  const [decisions, setDecisions] = useState<Partial<Record<string, 'granted' | 'denied'>>>({})

  const pendingChecks = checks.filter(tc => (decisions[tc.id] ?? tc.consentStatus) === 'pending')

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Businesses and lenders request your consent before viewing your trust profile.
      </p>

      {checks.length === 0 || pendingChecks.length === 0 && checks.every(tc => decisions[tc.id] !== undefined || tc.consentStatus !== 'pending') ? (
        checks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <CheckCircle style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No consent requests yet</p>
          </div>
        ) : null
      ) : null}

      {checks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {checks.map(check => {
            const co = companies.find(c => c.id === check.requesterCompanyId)
            const decision = decisions[check.id]
            const status = decision ?? check.consentStatus

            return (
              <div
                key={check.id}
                style={{ border: '1px solid var(--border-lt)', borderRadius: 10, padding: 16, background: 'var(--white)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>
                      {co?.businessName ?? 'Unknown Company'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {timeAgo(check.createdAt)}
                    </p>
                  </div>

                  {status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setDecisions(x => ({ ...x, [check.id]: 'denied' }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--risk-high-bg)', color: 'var(--risk-high)', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}
                      >
                        <XCircle style={{ width: 13, height: 13 }} /> Deny
                      </button>
                      <button
                        onClick={() => setDecisions(x => ({ ...x, [check.id]: 'granted' }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--risk-low-bg)', color: 'var(--risk-low)', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}
                      >
                        <CheckCircle style={{ width: 13, height: 13 }} /> Grant
                      </button>
                    </div>
                  ) : (
                    <span
                      className="badge"
                      style={
                        status === 'granted'
                          ? { background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }
                          : status === 'denied'
                            ? { background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }
                            : { background: 'var(--risk-med-bg)', color: 'var(--risk-med)' }
                      }
                    >
                      {status === 'granted' ? 'Access Granted' : status === 'denied' ? 'Access Denied' : 'Pending'}
                    </span>
                  )}
                </div>

                {check.scoreAtCheck != null && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Score shared: <strong style={{ color: 'var(--text-mid)' }}>{check.scoreAtCheck}</strong>
                    {check.riskTier && (
                      <> · Risk: <strong style={{ textTransform: 'capitalize' }}>{check.riskTier}</strong></>
                    )}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProfileTab({ user }: { user: typeof users[0] }) {
  const [bio, setBio] = useState(user.bio ?? '')
  const [profession, setProfession] = useState(user.profession)
  const [city, setCity] = useState(user.location)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const lockedFieldStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    borderRadius: 8, border: '1px solid var(--border-lt)',
    background: 'var(--surface-2)', color: 'var(--text-faint)',
    fontSize: 13, cursor: 'not-allowed',
    fontFamily: 'inherit',
  }

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 20 }}>
        My Profile
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Editable fields */}
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input"
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            placeholder="Tell others about yourself…"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div>
          <label className="label">Profession / Title</label>
          <input
            className="input"
            value={profession}
            onChange={e => setProfession(e.target.value)}
          />
        </div>

        <div>
          <label className="label">City</label>
          <input
            className="input"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>

        {/* Locked / read-only fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div>
            <label className="label" style={{ color: 'var(--text-faint)' }}>Full Name <span style={{ fontWeight: 400, fontSize: 11 }}>(locked)</span></label>
            <input
              readOnly
              disabled
              value={user.fullName}
              style={lockedFieldStyle}
            />
          </div>
          <div>
            <label className="label" style={{ color: 'var(--text-faint)' }}>Email <span style={{ fontWeight: 400, fontSize: 11 }}>(locked)</span></label>
            <input
              readOnly
              disabled
              value={user.email ?? ''}
              style={lockedFieldStyle}
            />
          </div>
          <div>
            <label className="label" style={{ color: 'var(--text-faint)' }}>Phone <span style={{ fontWeight: 400, fontSize: 11 }}>(locked)</span></label>
            <input
              readOnly
              disabled
              value={user.phone}
              style={lockedFieldStyle}
            />
          </div>
        </div>

        {/* Notice about locked fields */}
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
          To change your name or contact details, submit a request via{' '}
          <Link href="/settings" style={{ color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'none' }}>
            Settings →
          </Link>
        </div>

        <div>
          <button onClick={handleSave} className="btn btn-forest">
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
