'use client'
import { useState } from "react"
import Nav from "@/components/Nav"
import ScoreRing from "@/components/ScoreRing"
import { users, companies, credentials, trustChecks, financialInstitutions } from "@/lib/store"
import { computeScore } from "@/lib/scoring"
import { INSTITUTION_LABELS, FinancialInstitutionType } from "@/lib/types"
import { Search, CheckCircle, Clock, XCircle, Building2, ChevronRight, Banknote, Plus, Shield } from "lucide-react"

const COMPANY_ID = "co-1"

const INST_TYPE_STYLE: Record<FinancialInstitutionType, { bg: string; color: string }> = {
  central_bank:    { bg: 'var(--forest)',      color: 'var(--cream)' },
  commercial_bank: { bg: 'rgba(27,94,59,.1)',  color: 'var(--forest-mid)' },
  microfinance:    { bg: 'rgba(124,79,196,.1)', color: '#7C4FC4' },
  credit_union:    { bg: 'rgba(27,94,59,.08)', color: 'var(--forest-lt)' },
  insurance:       { bg: 'var(--gold-pale)',   color: 'var(--gold)' },
  mobile_money:    { bg: 'rgba(184,50,50,.08)', color: 'var(--risk-high)' },
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

export default function BusinessPage() {
  const company = companies.find(c => c.id === COMPANY_ID)!
  const [tab, setTab] = useState<'search' | 'checks' | 'institutions'>('search')
  const [query, setQuery] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [requested, setRequested] = useState<string[]>([])

  const freelancers = users.filter(u => u.role === 'individual' && u.idVerificationStatus === 'verified')
  const filtered = freelancers.filter(u =>
    [u.fullName, u.profession, u.location].some(s => s.toLowerCase().includes(query.toLowerCase())) &&
    u.trustScore >= minScore
  )
  const checks = trustChecks.filter(tc => tc.requesterCompanyId === COMPANY_ID)

  const tabs = [
    { id: 'search',       label: 'Search Freelancers' },
    { id: 'checks',       label: `Trust Checks (${checks.length})` },
    { id: 'institutions', label: 'Financial Institutions' },
  ] as const

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold)' }}>
              <Building2 className="w-5 h-5" style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--ink)' }}>{company.businessName}</h1>
                <span className="badge badge-forest">{company.verificationStatus}</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                {company.industry} · Plan: <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--ink-mid)' }}>{company.subscriptionPlan}</span>
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, color: 'var(--forest-mid)' }}>{company.checksRemaining}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>checks remaining · {company.checksUsed} used</div>
          </div>
        </div>

        {/* Card with tabs */}
        <div className="card overflow-hidden fade-up fade-up-1">
          <div style={{ borderBottom: '1px solid var(--border-lt)', display: 'flex', overflowX: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: '14px 22px', fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: tab === t.id ? 'var(--forest)' : 'var(--muted)',
                  borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {/* ── Search ── */}
            {tab === 'search' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                    <input value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="Search name, profession, or location…"
                      style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--white)', color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-body)' }} />
                  </div>
                  <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>Min score</span>
                    <input type="number" min={0} max={1000} value={minScore} onChange={e => setMinScore(Number(e.target.value))}
                      style={{ width: 72, border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, background: 'var(--white)', color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-body)' }} />
                  </div>
                </div>

                <div className="space-y-3">
                  {filtered.map(user => {
                    const userCreds = credentials.filter(c => c.subjectUserId === user.id)
                    const score = computeScore(userCreds)
                    const isExp = expanded === user.id
                    const alreadyReq = requested.includes(user.id)

                    return (
                      <div key={user.id} style={{ border: '1px solid var(--border-lt)', borderRadius: 10, overflow: 'hidden', background: 'var(--white)' }}>
                        <div className="flex items-center gap-4 cursor-pointer"
                          style={{ padding: '14px 16px' }}
                          onClick={() => setExpanded(isExp ? null : user.id)}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'var(--forest)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--gold-lt)' }}>
                            {user.fullName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{user.fullName}</span>
                              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--forest-mid)' }} />
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{user.profession} · {user.location}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: score.score >= 700 ? 'var(--risk-low)' : score.score >= 450 ? 'var(--risk-med)' : 'var(--risk-high)' }}>{score.score}</div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>score</div>
                            </div>
                            <span className="badge" style={{ background: score.riskTier === 'low' ? '#D1F0DC' : score.riskTier === 'medium' ? '#FEF0CC' : '#FDDADA', color: score.riskTier === 'low' ? 'var(--risk-low)' : score.riskTier === 'medium' ? 'var(--risk-med)' : 'var(--risk-high)' }}>
                              {score.riskTier}
                            </span>
                            {alreadyReq ? (
                              <span className="badge badge-gold">Awaiting consent</span>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); setRequested(r => [...r, user.id]) }}
                                style={{ fontSize: 12, fontWeight: 600, background: 'var(--forest)', color: 'var(--gold-lt)', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer' }}>
                                Request Check
                              </button>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--border)', transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                        </div>

                        {isExp && (
                          <div style={{ borderTop: '1px solid var(--border-lt)', padding: 20, background: 'var(--cream)' }}>
                            <div className="flex gap-8">
                              <ScoreRing score={score.score} riskTier={score.riskTier} confidence={score.confidence} size={130} />
                              <div className="flex-1">
                                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Credential Summary</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {['identity', 'financial', 'work_history', 'endorsement'].map(type => {
                                    const count = userCreds.filter(c => c.credentialType === type).length
                                    return (
                                      <div key={type} style={{ background: 'var(--white)', border: '1px solid var(--border-lt)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                                        <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                                        <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--ink)' }}>{count}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
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
                    <div className="text-center py-14" style={{ color: 'var(--muted)' }}>
                      <Search className="w-8 h-8 mx-auto mb-2" style={{ opacity: .3 }} />
                      <p style={{ fontSize: 14 }}>No verified freelancers match your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Checks ── */}
            {tab === 'checks' && (
              <div className="space-y-3">
                {checks.map(check => {
                  const subject = users.find(u => u.id === check.subjectUserId)
                  const statusStyle = check.consentStatus === 'granted' ? { bg: '#D1F0DC', color: 'var(--risk-low)' } : check.consentStatus === 'pending' ? { bg: '#FEF0CC', color: 'var(--risk-med)' } : { bg: '#FDDADA', color: 'var(--risk-high)' }
                  return (
                    <div key={check.id} className="flex items-center gap-4" style={{ border: '1px solid var(--border-lt)', borderRadius: 10, padding: '14px 16px', background: 'var(--white)' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink-mid)' }}>
                        {subject?.fullName[0]}
                      </div>
                      <div className="flex-1">
                        <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{subject?.fullName}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>{timeAgo(check.createdAt)}</p>
                      </div>
                      {check.consentStatus === 'granted' && check.scoreAtCheck && (
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--risk-low)' }}>{check.scoreAtCheck}</span>
                          <span className="badge" style={{ background: '#D1F0DC', color: 'var(--risk-low)' }}>{check.riskTier} Risk</span>
                        </div>
                      )}
                      <span className="badge flex items-center gap-1" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {check.consentStatus === 'granted' && <CheckCircle className="w-3 h-3" />}
                        {check.consentStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {check.consentStatus === 'denied' && <XCircle className="w-3 h-3" />}
                        {check.consentStatus}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Institutions ── */}
            {tab === 'institutions' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Financial Institutions</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>All institution types that can issue verified credentials</p>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, background: 'var(--forest)', color: 'var(--gold-lt)', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer' }}>
                    <Plus className="w-4 h-4" />Connect Institution
                  </button>
                </div>

                {/* Legend */}
                <div className="pattern-kanga-light rounded-xl p-4 mb-5" style={{ border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Provenance weight by institution type</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(INST_TYPE_STYLE) as [FinancialInstitutionType, { bg: string; color: string }][]).map(([type, style]) => (
                      <span key={type} className="badge" style={{ background: style.bg, color: style.color }}>
                        {INSTITUTION_LABELS[type]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {financialInstitutions.map(inst => {
                    const style = INST_TYPE_STYLE[inst.type]
                    return (
                      <div key={inst.id} className="flex items-center gap-4" style={{ border: '1px solid var(--border-lt)', borderRadius: 10, padding: '12px 16px', background: 'var(--white)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--cream)' }}>
                          <Banknote className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink)' }}>{inst.name}</span>
                            {inst.verified && <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--forest-mid)' }} />}
                          </div>
                          <span className="badge mt-1" style={{ background: style.bg, color: style.color, fontSize: 10 }}>
                            {INSTITUTION_LABELS[inst.type]}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--forest-mid)' }}>
                            {(inst.provenanceWeight * 100).toFixed(0)}%
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>provenance</div>
                        </div>
                        <div className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--muted)' }}>
                          <Shield className="w-3.5 h-3.5" />
                          <span>{inst.country}</span>
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
