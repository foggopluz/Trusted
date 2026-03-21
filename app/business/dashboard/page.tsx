'use client'
import { useState } from 'react'
import Nav from '@/app/components/Nav'
import ScoreRing from '@/app/components/ScoreRing'
import { users, companies, credentials, trustChecks, financialInstitutions } from '@/lib/store'
import { computeScore } from '@/lib/scoring'
import { INSTITUTION_LABELS, FinancialInstitutionType } from '@/lib/types'
import {
  Building2, CheckCircle, Clock, XCircle, Search,
  ChevronRight, Banknote, Shield, AlertCircle, Globe,
} from 'lucide-react'

const COMPANY_ID = 'co-1'

const INST_TYPE_STYLE: Record<FinancialInstitutionType, { bg: string; color: string }> = {
  central_bank:    { bg: 'var(--forest)',           color: 'var(--gold-lt)' },
  commercial_bank: { bg: 'rgba(27,94,59,.1)',        color: 'var(--forest-mid)' },
  microfinance:    { bg: 'rgba(124,79,196,.1)',       color: '#7C4FC4' },
  credit_union:    { bg: 'rgba(27,94,59,.07)',        color: 'var(--forest-lt)' },
  insurance:       { bg: 'var(--gold-pale)',          color: 'var(--gold)' },
  mobile_money:    { bg: 'rgba(184,50,50,.08)',       color: 'var(--risk-high)' },
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

function getScoreColor(score: number) {
  if (score >= 700) return 'var(--risk-low)'
  if (score >= 450) return 'var(--risk-med)'
  return 'var(--risk-high)'
}

const CONSENT_DISPLAY: Record<string, string> = {
  granted: 'Completed',
  pending: 'Pending',
  denied: 'Denied',
}

function getRiskBadgeStyle(tier: string) {
  if (tier === 'low') return { background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }
  if (tier === 'medium') return { background: 'var(--risk-med-bg)', color: 'var(--risk-med)' }
  return { background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }
}

export default function BusinessDashboardPage() {
  const company = companies.find(c => c.id === COMPANY_ID)!
  const [tab, setTab] = useState<'talent' | 'checks' | 'profile' | 'institutions'>('talent')
  const [query, setQuery] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [countryFilter, setCountryFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [requested, setRequested] = useState<string[]>([])
  const [toast, setToast] = useState(false)

  // Profile edit state
  const [desc, setDesc] = useState(company.description ?? '')
  const [website, setWebsite] = useState(company.website ?? '')
  const [address, setAddress] = useState(company.address ?? '')
  const [industry, setIndustry] = useState(company.industry ?? '')
  const [profileSaved, setProfileSaved] = useState(false)

  const freelancers = users.filter(u => u.role === 'individual' && u.idVerificationStatus === 'verified')
  const availableCountries = [...new Set(freelancers.map(u => u.country))].sort()
  const filtered = freelancers.filter(u =>
    [u.fullName, u.profession, u.location].some(s => s.toLowerCase().includes(query.toLowerCase())) &&
    u.trustScore >= minScore &&
    (countryFilter === '' || u.country === countryFilter)
  )
  const checks = trustChecks.filter(tc => tc.requesterCompanyId === COMPANY_ID)

  const tabs = [
    { id: 'talent' as const, label: 'Find Talent' },
    { id: 'checks' as const, label: `Trust Checks (${checks.length})` },
    { id: 'profile' as const, label: 'Company Profile' },
    { id: 'institutions' as const, label: 'Connected Institutions' },
  ]

  function showToast() {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  function saveProfile() {
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: 'var(--dark)', color: '#fff', padding: '12px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,.2)',
        }}>
          Coming soon — institution connections are in beta.
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: 24, height: 24, color: 'var(--gold)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
                  {company.businessName}
                </h1>
                {company.verificationStatus === 'verified' && (
                  <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle style={{ width: 11, height: 11 }} /> Verified Business
                  </span>
                )}
                <span className="badge badge-gold" style={{ textTransform: 'capitalize' }}>
                  {company.subscriptionPlan} Plan
                </span>
                <span className="badge" style={{ background: 'rgba(27,94,59,.08)', color: 'var(--forest-mid)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe style={{ width: 10, height: 10 }} /> {company.industry}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                {company.country}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--forest-mid)', lineHeight: 1 }}>
              {company.checksRemaining}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              checks remaining · {company.checksUsed} used
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="card fade-up fade-up-1" style={{ overflow: 'hidden' }}>
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

            {/* ── Find Talent ── */}
            {tab === 'talent' && (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ width: 15, height: 15, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search by name, profession, or location…"
                      className="input"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Min score</span>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={minScore}
                      onChange={e => setMinScore(Number(e.target.value))}
                      className="input"
                      style={{ width: 80 }}
                    />
                  </div>
                  <select
                    value={countryFilter}
                    onChange={e => setCountryFilter(e.target.value)}
                    className="input"
                    style={{ width: 140 }}
                  >
                    <option value="">All Countries</option>
                    {availableCountries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { /* search is reactive */ }}
                    className="btn btn-forest btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Search style={{ width: 13, height: 13, display: 'inline', marginRight: 4 }} />
                    Search
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filtered.map(user => {
                    const userCreds = credentials.filter(c => c.subjectUserId === user.id)
                    const score = computeScore(userCreds)
                    const isExp = expanded === user.id
                    const alreadyReq = requested.includes(user.id)
                    const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)

                    return (
                      <div
                        key={user.id}
                        style={{ border: '1px solid var(--border-lt)', borderRadius: 10, overflow: 'hidden', background: 'var(--white)' }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
                          onClick={() => setExpanded(isExp ? null : user.id)}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--gold-lt)' }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user.fullName}</span>
                              <CheckCircle style={{ width: 13, height: 13, color: 'var(--forest-mid)' }} />
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{user.profession} · {user.location}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: getScoreColor(score.score), lineHeight: 1 }}>{score.score}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>score</div>
                            </div>
                            <span className="badge" style={getRiskBadgeStyle(score.riskTier)}>
                              {score.riskTier}
                            </span>
                            {alreadyReq ? (
                              <span className="badge badge-gold">Awaiting consent</span>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); setRequested(r => [...r, user.id]) }}
                                className="btn btn-forest btn-sm"
                              >
                                Request Check
                              </button>
                            )}
                          </div>
                          <ChevronRight style={{ width: 15, height: 15, color: 'var(--border)', flexShrink: 0, transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                        </div>

                        {isExp && (
                          <div style={{ borderTop: '1px solid var(--border-lt)', padding: 20, background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', gap: 24 }}>
                              <ScoreRing
                                score={score.score}
                                riskTier={score.riskTier}
                                confidence={score.confidence}
                                size={120}
                              />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                                  Credential Summary
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  {['identity', 'financial', 'work_history', 'endorsement', 'skill'].map(type => {
                                    const count = userCreds.filter(c => c.credentialType === type).length
                                    return (
                                      <div key={type} style={{ background: 'var(--white)', border: '1px solid var(--border-lt)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                                        <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                                        <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--text)' }}>{count}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                                  {score.dataAgeMonths} months of data · {score.credentialCount} active credentials
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                      <Search style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                      <p style={{ fontSize: 14 }}>No verified users match your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Trust Checks ── */}
            {tab === 'checks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {checks.map(check => {
                  const subject = users.find(u => u.id === check.subjectUserId)
                  const statusStyle = check.consentStatus === 'granted'
                    ? { bg: 'var(--risk-low-bg)', color: 'var(--risk-low)', icon: CheckCircle }
                    : check.consentStatus === 'pending'
                      ? { bg: 'var(--risk-med-bg)', color: 'var(--risk-med)', icon: Clock }
                      : { bg: 'var(--risk-high-bg)', color: 'var(--risk-high)', icon: XCircle }
                  const Icon = statusStyle.icon
                  const initials = subject?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'

                  return (
                    <div
                      key={check.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border-lt)', borderRadius: 10, padding: '14px 16px', background: 'var(--white)' }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-mid)', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{subject?.fullName ?? 'Unknown'}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{timeAgo(check.createdAt)}</p>
                      </div>
                      {check.consentStatus === 'granted' && check.scoreAtCheck && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: getScoreColor(check.scoreAtCheck) }}>
                            {check.scoreAtCheck}
                          </span>
                          {check.riskTier && (
                            <span className="badge" style={getRiskBadgeStyle(check.riskTier)}>
                              {check.riskTier} risk
                            </span>
                          )}
                        </div>
                      )}
                      <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon style={{ width: 11, height: 11 }} />
                        {CONSENT_DISPLAY[check.consentStatus] ?? check.consentStatus}
                      </span>
                    </div>
                  )
                })}
                {checks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    <Shield style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>No trust checks yet</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Company Profile ── */}
            {tab === 'profile' && (
              <div>
                {/* Locked info box */}
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderRadius: 8, background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', marginBottom: 24, fontSize: 13, color: 'var(--text-mid)' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>To update your business name or contact details, submit a Change Request to TrustNet Admin.</strong>{' '}
                    <button style={{ background: 'none', border: 'none', color: 'var(--forest-mid)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13 }}>
                      Submit Change Request →
                    </button>
                  </div>
                </div>

                {/* Locked fields — Business Name, TIN, Registration Number highlighted first */}
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Read-Only Fields
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Business Name',       value: company.businessName },
                    { label: 'TIN',                 value: company.tinNumber },
                    { label: 'Registration Number', value: company.tinNumber.replace('TIN-', 'REG-') },
                    { label: 'Country',             value: company.country },
                    { label: 'Contact Phone',       value: company.contactPhone ?? '—' },
                    { label: 'Contact Email',       value: company.contactEmail ?? '—' },
                    { label: 'Founded',             value: company.foundedAt },
                    { label: 'Member Since',        value: company.memberSince },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="label">{field.label}</label>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-lt)', fontSize: 13, color: 'var(--text-mid)', cursor: 'not-allowed' }}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-lt)', paddingTop: 24 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Editable Fields
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="label">Description</label>
                      <textarea
                        className="input"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        rows={3}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="label">Website</label>
                        <input className="input" value={website} onChange={e => setWebsite(e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Physical Address</label>
                        <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Industry</label>
                      <select
                        className="input"
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                      >
                        {[
                          'Technology', 'Agritech', 'Fintech', 'Management Consulting',
                          'Creative Agency', 'Healthcare', 'Education', 'Logistics',
                          'Manufacturing', 'Retail', 'Real Estate', 'Other',
                        ].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button onClick={saveProfile} className="btn btn-forest">
                        {profileSaved ? 'Saved' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Connected Institutions ── */}
            {tab === 'institutions' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--text)', margin: 0 }}>Financial Institutions</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>All institution types that issue verified credentials on TrustNet</p>
                  </div>
                  <button onClick={showToast} className="btn btn-forest btn-sm">
                    + Connect Institution
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {financialInstitutions.map(inst => {
                    const style = INST_TYPE_STYLE[inst.type]
                    return (
                      <div
                        key={inst.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border-lt)', borderRadius: 10, padding: '12px 16px', background: 'var(--white)' }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Banknote style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{inst.name}</span>
                            {inst.verified && <CheckCircle style={{ width: 13, height: 13, color: 'var(--forest-mid)' }} />}
                          </div>
                          <span className="badge" style={{ background: style.bg, color: style.color, fontSize: 10, marginTop: 3, display: 'inline-block' }}>
                            {INSTITUTION_LABELS[inst.type]}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 8 }}>{inst.country}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--forest-mid)', lineHeight: 1 }}>
                            {(inst.provenanceWeight * 100).toFixed(0)}%
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>provenance</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
