'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Nav from '@/components/Nav'
import ScoreRing from '@/components/ScoreRing'
import StarRating, { RatingDisplay } from '@/components/StarRating'
import { companies, ratings } from '@/lib/store'
import { Building2, CheckCircle, Star, Globe, MapPin, Phone, Mail, Calendar } from 'lucide-react'

function getScoreColor(score: number) {
  if (score >= 700) return 'var(--risk-low)'
  if (score >= 450) return 'var(--risk-med)'
  return 'var(--risk-high)'
}

function getRiskBadgeStyle(tier: string) {
  if (tier === 'low') return { background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }
  if (tier === 'medium') return { background: 'var(--risk-med-bg)', color: 'var(--risk-med)' }
  return { background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }
}

function maskPhone(phone: string) {
  // Show first 4 characters then ****
  if (!phone) return ''
  return phone.slice(0, 4) + '****'
}

function maskEmail(email: string) {
  // Show first 3 chars of local part + ****@****.com
  if (!email) return ''
  const local = email.split('@')[0] ?? ''
  return local.slice(0, 3) + '****@****.com'
}

function maskTIN(tin: string) {
  // Show first 7 chars, mask rest
  return tin.slice(0, 7) + '***'
}

function monthsSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30))
}

export default function BusinessProfilePage() {
  const params = useParams()
  const id = params.id as string

  const company = companies.find(c => c.id === id)
  const [starVal, setStarVal] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!company) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
        <Nav />
        <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <Building2 style={{ width: 48, height: 48, margin: '0 auto 20px', color: 'var(--text-faint)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>
            Business Not Found
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No TrustNet business profile exists for this ID.
          </p>
        </div>
      </div>
    )
  }

  // Company score: derive from verification status + operating maturity
  const verified = company.verificationStatus === 'verified'
  const ageMonths = monthsSince(company.foundedAt)
  const ageFactor = Math.min(ageMonths / 36, 1) // max out at 3 years
  const companyScore = verified
    ? Math.round(650 + ageFactor * 250)   // 650–900 for verified businesses
    : Math.round(200 + ageFactor * 150)   // 200–350 for unverified
  const riskTier = companyScore >= 700 ? 'low' : companyScore >= 450 ? 'medium' : 'high'
  const score = {
    score: companyScore,
    riskTier: riskTier as 'low' | 'medium' | 'high',
    confidence: (verified ? 'high' : 'low') as 'low' | 'medium' | 'high',
    dataAgeMonths: ageMonths,
    credentialCount: verified ? 3 : 0,
    breakdown: {
      identity:            verified ? Math.round(companyScore * 0.20) : 0,
      financial:           verified ? Math.round(companyScore * 0.30) : 0,
      contractPerformance: verified ? Math.round(companyScore * 0.30) : 0,
      networkTrust:        verified ? Math.round(companyScore * 0.20) : 0,
      disputePenalty:      0,
    },
  }

  const companyRatings = ratings.filter(r => r.targetId === company.id && r.targetType === 'company')
  const avgStars = companyRatings.length > 0
    ? companyRatings.reduce((s, r) => s + r.stars, 0) / companyRatings.length
    : 0

  const memberMonths = monthsSince(company.foundedAt)

  const breakdown = [
    { label: 'Identity',     value: score.breakdown.identity,           max: 150,  color: 'var(--forest-mid)' },
    { label: 'Financial',    value: score.breakdown.financial,           max: 250,  color: 'var(--gold)' },
    { label: 'Work History', value: score.breakdown.contractPerformance, max: 250,  color: '#7C4FC4' },
    { label: 'Network',      value: score.breakdown.networkTrust,        max: 200,  color: '#C07A0A' },
  ]

  function submitRating() {
    if (starVal === 0) return
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />

      {/* Hero */}
      <div style={{ background: 'var(--forest)', paddingTop: 48, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--dark)', border: '3px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 style={{ width: 36, height: 36, color: 'var(--gold-lt)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  {company.businessName}
                </h1>
                {company.verificationStatus === 'verified' && (
                  <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle style={{ width: 12, height: 12 }} /> Verified
                  </span>
                )}
                <span className="badge badge-gold">{company.industry}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>
                {company.country}
                {company.website && (
                  <> · <span style={{ color: 'rgba(255,255,255,.7)' }}>{company.website}</span></>
                )}
                {company.foundedAt && (
                  <> · Founded {new Date(company.foundedAt).getFullYear()}</>
                )}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
                <div>
                  <span className="stat-num" style={{ color: getScoreColor(score.score), fontSize: 40, lineHeight: 1 }}>
                    {score.score}
                  </span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginLeft: 4 }}>/ 1000</span>
                </div>
                <span className="badge" style={getRiskBadgeStyle(score.riskTier)}>
                  {score.riskTier} risk
                </span>
                {avgStars > 0 && (
                  <RatingDisplay avg={avgStars} count={companyRatings.length} size={16} />
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="fade-up fade-up-1" style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Trust Score',   value: String(score.score) },
              { label: 'Industry',      value: company.industry },
              { label: 'Member Since',  value: company.memberSince },
              { label: 'Operating Months', value: `${memberMonths}` },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 20px', border: '1px solid rgba(255,255,255,.1)', minWidth: 130 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--gold-lt)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* About */}
            {company.description && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>About</h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7 }}>{company.description}</p>
              </div>
            )}

            {/* Details */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>Company Details</h3>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border-lt)' }}>
                <span>🔒</span> Contact details are partially masked for privacy. Connect to see full details.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {company.address && (
                  <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                    <MapPin style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>Address</span>
                      <span style={{ color: 'var(--text-mid)' }}>{company.address}</span>
                    </div>
                  </div>
                )}
                {company.contactPhone && (
                  <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                    <Phone style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>Phone</span>
                      <span style={{ color: 'var(--text-mid)' }}>{maskPhone(company.contactPhone)}</span>
                    </div>
                  </div>
                )}
                {company.contactEmail && (
                  <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                    <Mail style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>Email</span>
                      <span style={{ color: 'var(--text-mid)' }}>{maskEmail(company.contactEmail)}</span>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                    <Globe style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>Website</span>
                      <span style={{ color: 'var(--forest-mid)' }}>{company.website}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                  <Calendar style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>Founded</span>
                    <span style={{ color: 'var(--text-mid)' }}>{company.foundedAt} · Member since {company.memberSince}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, fontSize: 14, textAlign: 'center' }}>🪪</span>
                  <div>
                    <span style={{ color: 'var(--text-faint)', display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 2 }}>TIN</span>
                    <span style={{ color: 'var(--text-mid)', fontFamily: 'monospace' }}>{maskTIN(company.tinNumber)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>Trust Score Breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ScoreRing score={score.score} riskTier={score.riskTier} confidence={score.confidence} size={110} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {breakdown.map(item => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                          <span style={{ color: 'var(--text-mid)' }}>{item.label}</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: item.color }}>{item.value}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
                Reviews <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({companyRatings.length})</span>
              </h3>
              {companyRatings.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No reviews yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {companyRatings.map(rating => (
                    <div key={rating.id} style={{ paddingBottom: 14, borderBottom: '1px solid var(--border-lt)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{rating.raterName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {new Date(rating.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <StarRating value={rating.stars} readonly size={15} />
                      {rating.comment && (
                        <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6, fontStyle: 'italic' }}>
                          "{rating.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="card" style={{ padding: 24, borderTop: '3px solid var(--gold)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
                Rate This Business
              </h3>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Star style={{ width: 36, height: 36, color: 'var(--gold)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>Thank you for your review!</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Your review helps build trust on TrustNet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label">Your rating</label>
                    <StarRating value={starVal} onChange={setStarVal} size={28} />
                  </div>
                  <div>
                    <label className="label">Comment (optional)</label>
                    <textarea
                      className="input"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={3}
                      placeholder="Share your experience with this business…"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button
                    onClick={submitRating}
                    disabled={starVal === 0}
                    className="btn btn-gold"
                    style={{ opacity: starVal === 0 ? 0.5 : 1, cursor: starVal === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    Submit Rating
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
