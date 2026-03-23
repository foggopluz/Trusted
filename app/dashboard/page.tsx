'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import ScoreRing from '@/components/ScoreRing'
import { users, credentials, trustChecks, companies, financialInstitutions } from '@/lib/store'
import { computeScore, computeScoreFromSupabase } from '@/lib/scoring'
import { INSTITUTION_LABELS } from '@/lib/types'
import { IS_DEMO_MODE, createSupabaseBrowserClient } from '@/lib/supabase'
import type { ProfileRow, CredentialRow, TrustCheckRow } from '@/lib/supabase'
import {
  Shield, Briefcase, ThumbsUp, DollarSign, Award,
  Clock, CheckCircle, XCircle, Share2, Search, PlusCircle, Loader2,
} from 'lucide-react'

// ─── Demo fallback user ───────────────────────────────────────────────────────
const DEMO_USER_ID = 'u-1'

interface DemoSessionUser {
  email: string
  name: string
  fullName: string
  phone?: string
  country?: string
  city?: string
  profession?: string
  accountType?: string
  role?: string
  isHardcodedDemo?: boolean
}

// ─── Credential display types ─────────────────────────────────────────────────

interface DisplayCredential {
  id: string
  credentialType: string
  title: string
  issuerLabel: string
  confidence: number
  provenanceWeight: number
  status: string
  issuedAt: string
  expiresAt?: string
}

interface DisplayTrustCheck {
  id: string
  requesterCompanyName: string
  consentStatus: string
  createdAt: string
  scoreAtCheck?: number
  riskTier?: string
}

interface UnifiedScore {
  score: number
  riskTier: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  breakdown: {
    identity: number
    financial: number
    contractPerformance: number
    networkTrust: number
  }
}

// ─── Credential icon / colour maps ────────────────────────────────────────────

const CRED_ICON: Record<string, React.ElementType> = {
  identity: Shield,
  financial: DollarSign,
  work_history: Briefcase,
  endorsement: ThumbsUp,
  skill: Award,
}

const CRED_ACCENT: Record<string, string> = {
  identity:    'var(--forest-mid)',
  financial:   'var(--gold)',
  work_history: '#7C4FC4',
  endorsement:  '#C07A0A',
  skill:        '#B83232',
}

const CRED_BG: Record<string, string> = {
  identity:    'rgba(27,94,59,.1)',
  financial:   'var(--gold-pale)',
  work_history: 'rgba(124,79,196,.1)',
  endorsement:  'rgba(192,122,10,.1)',
  skill:        'rgba(184,50,50,.1)',
}

const CRED_LABEL: Record<string, string> = {
  identity:    'Identity',
  financial:   'Financial',
  work_history: 'Work History',
  endorsement:  'Endorsement',
  skill:        'Skill',
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const mo = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30))
  return mo < 1 ? '< 1 month ago' : mo === 1 ? '1 month ago' : `${mo} months ago`
}

function truncateDid(did: string) {
  if (did.length <= 24) return did
  return did.slice(0, 14) + '…' + did.slice(-8)
}

// Map store Credential → DisplayCredential
function storeCredToDisplay(cred: (typeof credentials)[0]): DisplayCredential {
  const inst = cred.issuerInstitutionId
    ? financialInstitutions.find(f => f.id === cred.issuerInstitutionId)
    : null
  const issuerLabel = inst
    ? inst.name
    : cred.issuerUserId === 'u-admin'
      ? 'TrustNet'
      : cred.issuerCompanyId
        ? (companies.find(c => c.id === cred.issuerCompanyId)?.businessName ?? 'Company')
        : cred.issuerUserId
          ? (users.find(u => u.id === cred.issuerUserId)?.fullName ?? 'Peer')
          : 'Unknown'
  const provenanceWeight = inst
    ? inst.provenanceWeight
    : cred.issuerUserId === 'u-admin'
      ? 0.98
      : cred.issuerCompanyId
        ? 0.85
        : 0.70
  return {
    id: cred.id,
    credentialType: cred.credentialType,
    title: cred.title,
    issuerLabel,
    confidence: cred.confidence,
    provenanceWeight,
    status: cred.status,
    issuedAt: cred.issuedAt,
    expiresAt: cred.expiresAt,
  }
}

// Map Supabase CredentialRow → DisplayCredential
function supabaseCredToDisplay(cred: CredentialRow): DisplayCredential {
  return {
    id: cred.id,
    credentialType: cred.type,
    title: cred.title ?? cred.type,
    issuerLabel: cred.issuer_name ?? 'TrustNet',
    confidence: cred.confidence ?? 0.7,
    provenanceWeight: cred.provenance_weight ?? 0.7,
    status: cred.status,
    issuedAt: cred.issued_at,
  }
}

// Merge ScoreResult or SupabaseScoreResult → UnifiedScore
function toUnifiedScore(
  result: ReturnType<typeof computeScore> | ReturnType<typeof computeScoreFromSupabase>
): UnifiedScore {
  if ('breakdown' in result && 'identity' in result.breakdown && 'financial' in result.breakdown) {
    // store ScoreResult
    const r = result as ReturnType<typeof computeScore>
    return {
      score: r.score,
      riskTier: r.riskTier,
      confidence: r.confidence,
      breakdown: {
        identity: r.breakdown.identity,
        financial: r.breakdown.financial,
        contractPerformance: r.breakdown.contractPerformance,
        networkTrust: r.breakdown.networkTrust,
      },
    }
  }
  // SupabaseScoreResult
  const r = result as ReturnType<typeof computeScoreFromSupabase>
  return {
    score: r.score,
    riskTier: r.riskTier,
    confidence: r.confidence,
    breakdown: {
      identity: r.breakdown.identity,
      financial: r.breakdown.payments,
      contractPerformance: r.breakdown.employment,
      networkTrust: r.breakdown.endorsements,
    },
  }
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [realProfile,     setRealProfile]     = useState<ProfileRow | null>(null)
  const [realCreds,       setRealCreds]       = useState<CredentialRow[] | null>(null)
  const [realChecks,      setRealChecks]      = useState<TrustCheckRow[] | null>(null)
  const [demoSessionUser, setDemoSessionUser] = useState<DemoSessionUser | null>(null)
  const [authLoading,     setAuthLoading]     = useState(true)

  useEffect(() => {
    if (IS_DEMO_MODE) {
      // Check if someone logged in during this session
      try {
        const raw = sessionStorage.getItem('tn_current_user')
        if (raw) {
          const cu = JSON.parse(raw) as DemoSessionUser
          // Hardcoded demo accounts stay on the default u-1 data
          if (!cu.isHardcodedDemo && cu.email !== 'demo@trustnet.com') {
            setDemoSessionUser(cu)
          }
        }
      } catch { /* ignore */ }
      setAuthLoading(false)
      return
    }
    // Real Supabase mode
    const client = createSupabaseBrowserClient()
    client.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setAuthLoading(false); return }
      const profileRes = await client.from('profiles').select('*').eq('id', user.id).single()
      const credsRes   = await client.from('credentials').select('*').eq('user_id', user.id).order('issued_at', { ascending: false })
      const checksRes  = await client.from('trust_checks').select('*').eq('subject_id', user.id).order('created_at', { ascending: false })
      if (profileRes.data) setRealProfile(profileRes.data as ProfileRow)
      if (credsRes.data)   setRealCreds(credsRes.data as CredentialRow[])
      if (checksRes.data)  setRealChecks(checksRes.data as TrustCheckRow[])
      setAuthLoading(false)
    }).catch(() => setAuthLoading(false))
  }, [])

  // ─── Determine display data ─────────────────────────────────────────────────
  const demoUser   = users.find(u => u.id === DEMO_USER_ID)!
  const isRealUser = !IS_DEMO_MODE && realProfile !== null
  // A session-registered user who logged in during this browser session
  const isSessionUser = IS_DEMO_MODE && demoSessionUser !== null

  const displayName        = isRealUser   ? realProfile!.full_name
                           : isSessionUser ? demoSessionUser!.fullName
                           : demoUser.fullName
  const displayEmail       = isRealUser   ? (realProfile!.email ?? '')
                           : isSessionUser ? (demoSessionUser!.email ?? '')
                           : (demoUser.email ?? '')
  const displayPhone       = isRealUser   ? (realProfile!.phone ?? '')
                           : isSessionUser ? (demoSessionUser!.phone ?? '')
                           : demoUser.phone
  const displayProfession  = isRealUser   ? (realProfile!.profession ?? 'Member')
                           : isSessionUser ? (demoSessionUser!.profession || 'Member')
                           : demoUser.profession
  const displayCity        = isRealUser   ? (realProfile!.city ?? '')
                           : isSessionUser ? (demoSessionUser!.city ?? '')
                           : demoUser.location
  const displayCountry     = isRealUser   ? (realProfile!.country ?? '')
                           : isSessionUser ? (demoSessionUser!.country ?? '')
                           : demoUser.country
  const displayDid         = isRealUser
    ? (realProfile!.did ?? `did:trustnet:${realProfile!.id.slice(0, 16)}`)
    : isSessionUser
      ? `did:trustnet:${demoSessionUser!.email.replace(/[@.]/g, '-').toLowerCase()}`
      : demoUser.did
  const displayMemberSince = isRealUser   ? (realProfile!.member_since ?? 'Recently')
                           : isSessionUser ? 'Recently'
                           : demoUser.memberSince
  const displayVerified    = isRealUser   ? realProfile!.id_verification_status
                           : isSessionUser ? 'pending'
                           : demoUser.idVerificationStatus
  const displayBio         = isRealUser   ? (realProfile!.bio ?? '')
                           : isSessionUser ? ''
                           : (demoUser.bio ?? '')

  // Credentials — new session users start fresh (pending identity)
  const demoCreds = credentials.filter(c => c.subjectUserId === DEMO_USER_ID)
  const sessionCreds: DisplayCredential[] = isSessionUser ? [{
    id: 'pending-id',
    credentialType: 'identity',
    title: 'Identity Verification',
    issuerLabel: 'TrustNet',
    confidence: 0.3,
    provenanceWeight: 0.98,
    status: 'pending',
    issuedAt: new Date().toISOString(),
  }] : []

  const displayCreds: DisplayCredential[] = isRealUser
    ? (realCreds ?? []).map(supabaseCredToDisplay)
    : isSessionUser
      ? sessionCreds
      : demoCreds.map(storeCredToDisplay)

  // Score
  const rawScore = isRealUser
    ? computeScoreFromSupabase(
        (realCreds ?? []).map(c => ({
          id: c.id,
          type: c.type as 'employment' | 'payment' | 'endorsement' | 'identity' | 'skill',
          status: c.status as 'pending' | 'approved' | 'rejected',
          created_at: c.created_at,
        })),
        realProfile!.id_verification_status,
      )
    : isSessionUser
      ? computeScoreFromSupabase([], 'pending')
      : computeScore(demoCreds)
  const scoreResult = toUnifiedScore(rawScore)

  // Trust checks
  const demoTrustChecks = trustChecks.filter(tc => tc.subjectUserId === DEMO_USER_ID)
  const displayChecks: DisplayTrustCheck[] = isRealUser
    ? (realChecks ?? []).map(tc => ({
        id: tc.id,
        requesterCompanyName: tc.requester_company_id ?? 'A Business',
        consentStatus: tc.consent_status,
        createdAt: tc.created_at,
      }))
    : isSessionUser
      ? [] // new users have no checks yet
      : demoTrustChecks.map(tc => ({
          id: tc.id,
          requesterCompanyName: companies.find(c => c.id === tc.requesterCompanyId)?.businessName ?? 'Unknown',
          consentStatus: tc.consentStatus,
          createdAt: tc.createdAt,
          scoreAtCheck: tc.scoreAtCheck,
          riskTier: tc.riskTier,
        }))

  // ─── Local UI state ─────────────────────────────────────────────────────────
  const [tab, setTab]                     = useState<'wallet' | 'checks' | 'profile'>('wallet')
  const [didCopied, setDidCopied]         = useState(false)
  const [trustCheckModal, setTrustCheckModal] = useState(false)
  const [trustCheckSent, setTrustCheckSent]   = useState(false)
  const [trustCheckTarget, setTrustCheckTarget] = useState('')

  function submitTrustCheck() {
    if (!trustCheckTarget.trim()) return
    setTrustCheckSent(true)
    setTimeout(() => { setTrustCheckModal(false); setTrustCheckSent(false); setTrustCheckTarget('') }, 1800)
  }

  function copyDid() {
    navigator.clipboard.writeText(displayDid).catch(() => undefined)
    setDidCopied(true)
    setTimeout(() => setDidCopied(false), 2000)
  }

  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
  const pendingCount = displayChecks.filter(tc => tc.consentStatus === 'pending').length

  const tabs = [
    { id: 'wallet'  as const, label: 'Trust Wallet' },
    { id: 'checks'  as const, label: 'Consent Requests' },
    { id: 'profile' as const, label: 'My Profile' },
  ]

  const breakdown = [
    { label: 'Identity Verification', value: scoreResult.breakdown.identity,           max: 150, color: 'var(--forest-mid)' },
    { label: 'Financial History',      value: scoreResult.breakdown.financial,           max: 250, color: 'var(--gold)' },
    { label: 'Work Contracts',         value: scoreResult.breakdown.contractPerformance, max: 250, color: '#7C4FC4' },
    { label: 'Network Endorsements',   value: scoreResult.breakdown.networkTrust,        max: 200, color: '#C07A0A' },
  ]

  // Loading spinner for real-mode auth check
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
        <Nav />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <Loader2 style={{ width: 32, height: 32, color: 'var(--forest-mid)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  const profileUserId = isRealUser ? realProfile!.id : DEMO_USER_ID
  const realUserId    = isRealUser ? realProfile!.id : undefined

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                {displayName}
              </h1>
              {displayVerified === 'verified' && (
                <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle style={{ width: 12, height: 12 }} /> Verified
                </span>
              )}
              {displayVerified === 'pending' && (
                <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--risk-med-bg)', color: 'var(--risk-med)' }}>
                  <Clock style={{ width: 12, height: 12 }} /> Verification Pending
                </span>
              )}
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              {displayProfession}{displayCity ? ` · ${displayCity}` : ''}{displayCountry ? `, ${displayCountry}` : ''}
            </p>

            <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 4px' }}>
              Member since {displayMemberSince}
            </p>

            <button
              onClick={copyDid}
              title={didCopied ? 'Copied!' : `Copy DID: ${displayDid}`}
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
              {didCopied ? '✓ Copied' : truncateDid(displayDid)}
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
                <Link
                  href={`/profile/${profileUserId}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, color: 'var(--text-mid)', textDecoration: 'none' }}
                >
                  <Share2 style={{ width: 15, height: 15, color: 'var(--forest-mid)' }} />
                  Share My Profile
                </Link>

                <button
                  onClick={() => setTrustCheckModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, color: 'var(--text-mid)', cursor: 'pointer' }}
                >
                  <Search style={{ width: 15, height: 15, color: 'var(--gold)' }} />
                  Request Trust Check
                </button>

                <Link
                  href="/credentials"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 500, color: 'var(--text-mid)', textDecoration: 'none' }}
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
              {tab === 'wallet' && <WalletTab creds={displayCreds} />}
              {tab === 'checks' && <ChecksTab checks={displayChecks} />}
              {tab === 'profile' && (
                <ProfileTab
                  fullName={displayName}
                  email={displayEmail}
                  phone={displayPhone}
                  profession={displayProfession}
                  city={displayCity}
                  bio={displayBio}
                  isRealUser={isRealUser}
                  userId={realUserId}
                />
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

// ─── WalletTab ────────────────────────────────────────────────────────────────

function WalletTab({ creds }: { creds: DisplayCredential[] }) {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'identity', 'financial', 'work_history', 'endorsement', 'skill']
  const filtered = filter === 'all' ? creds : creds.filter(c => c.credentialType === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
          Credentials <span style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 400 }}>({creds.length})</span>
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
              {f === 'all' ? 'All' : (CRED_LABEL[f] ?? f)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(cred => {
          const Icon    = CRED_ICON[cred.credentialType] ?? Shield
          const accent  = CRED_ACCENT[cred.credentialType] ?? 'var(--text-mid)'
          const bg      = CRED_BG[cred.credentialType] ?? 'var(--surface-2)'

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
                  <span className="badge" style={{ background: bg, color: accent, fontSize: 10 }}>
                    {CRED_LABEL[cred.credentialType] ?? cred.credentialType}
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
                  <strong style={{ color: 'var(--text-mid)' }}>{cred.issuerLabel}</strong>
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
                    <strong style={{ color: 'var(--gold)' }}>{(cred.provenanceWeight * 100).toFixed(0)}%</strong> provenance
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="progress-track" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${cred.confidence * 100}%`, background: accent }} />
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Shield style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No credentials in this category yet</p>
            <Link href="/credentials" style={{ fontSize: 13, color: 'var(--forest-mid)', textDecoration: 'none', fontWeight: 600 }}>
              + Add a credential
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ChecksTab ────────────────────────────────────────────────────────────────

function ChecksTab({ checks }: { checks: DisplayTrustCheck[] }) {
  const [decisions, setDecisions] = useState<Partial<Record<string, 'granted' | 'denied'>>>({})

  async function handleConsent(checkId: string, action: 'granted' | 'denied') {
    setDecisions(x => ({ ...x, [checkId]: action }))
    try {
      await fetch('/api/trust-checks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkId, status: action }),
      })
    } catch { /* optimistic update already applied */ }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Businesses and lenders request your consent before viewing your trust profile.
      </p>

      {checks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <CheckCircle style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No consent requests yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {checks.map(check => {
            const decision = decisions[check.id]
            const status   = decision ?? check.consentStatus

            return (
              <div
                key={check.id}
                style={{ border: '1px solid var(--border-lt)', borderRadius: 10, padding: 16, background: 'var(--white)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>
                      {check.requesterCompanyName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {timeAgo(check.createdAt)}
                    </p>
                  </div>

                  {status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleConsent(check.id, 'denied')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: 'var(--risk-high-bg)', color: 'var(--risk-high)', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer' }}
                      >
                        <XCircle style={{ width: 13, height: 13 }} /> Deny
                      </button>
                      <button
                        onClick={() => handleConsent(check.id, 'granted')}
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

// ─── ProfileTab ───────────────────────────────────────────────────────────────

interface ProfileTabProps {
  fullName: string
  email: string
  phone: string
  profession: string
  city: string
  bio: string
  isRealUser: boolean
  userId?: string
}

function ProfileTab({ fullName, email, phone, profession, city, bio, isRealUser, userId }: ProfileTabProps) {
  const [bioVal,        setBioVal]        = useState(bio)
  const [professionVal, setProfessionVal] = useState(profession)
  const [cityVal,       setCityVal]       = useState(city)
  const [saved,         setSaved]         = useState(false)
  const [saving,        setSaving]        = useState(false)

  async function handleSave() {
    if (isRealUser && userId) {
      setSaving(true)
      try {
        const client = createSupabaseBrowserClient()
        await client.from('profiles').update({
          bio: bioVal,
          profession: professionVal,
          city: cityVal,
        }).eq('id', userId)
      } catch { /* ignore */ }
      setSaving(false)
    }
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
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input"
            value={bioVal}
            onChange={e => setBioVal(e.target.value)}
            rows={4}
            placeholder="Tell others about yourself…"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div>
          <label className="label">Profession / Title</label>
          <input
            className="input"
            value={professionVal}
            onChange={e => setProfessionVal(e.target.value)}
          />
        </div>

        <div>
          <label className="label">City</label>
          <input
            className="input"
            value={cityVal}
            onChange={e => setCityVal(e.target.value)}
          />
        </div>

        {/* Locked fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div>
            <label className="label" style={{ color: 'var(--text-faint)' }}>Full Name <span style={{ fontWeight: 400, fontSize: 11 }}>(locked)</span></label>
            <input readOnly disabled value={fullName} style={lockedFieldStyle} />
          </div>
          <div>
            <label className="label" style={{ color: 'var(--text-faint)' }}>Email <span style={{ fontWeight: 400, fontSize: 11 }}>(locked)</span></label>
            <input readOnly disabled value={email} style={lockedFieldStyle} />
          </div>
          {phone && (
            <div>
              <label className="label" style={{ color: 'var(--text-faint)' }}>Phone <span style={{ fontWeight: 400, fontSize: 11 }}>(locked)</span></label>
              <input readOnly disabled value={phone} style={lockedFieldStyle} />
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
          To change your name or contact details, submit a request via{' '}
          <Link href="/settings" style={{ color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'none' }}>
            Settings →
          </Link>
        </div>

        <div>
          <button onClick={handleSave} className="btn btn-forest" disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
