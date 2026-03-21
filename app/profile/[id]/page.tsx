'use client'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Nav from '@/app/components/Nav'
import ScoreRing from '@/app/components/ScoreRing'
import StarRating, { RatingDisplay } from '@/app/components/StarRating'
import { users, credentials, ratings } from '@/lib/store'
import { computeScore } from '@/lib/scoring'
import { CheckCircle, Shield, DollarSign, Briefcase, ThumbsUp, Award, Star } from 'lucide-react'

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

const CRED_LABEL: Record<string, string> = {
  identity: 'Identity',
  financial: 'Financial',
  work_history: 'Work History',
  endorsement: 'Endorsement',
  skill: 'Skill',
}

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

function monthsSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30))
}

export default function ProfilePage() {
  const params = useParams()
  const id = params.id as string

  const user = users.find(u => u.id === id)
  const userCreds = credentials.filter(c => c.subjectUserId === id && c.status === 'active')
  const userRatings = ratings.filter(r => r.targetId === id && r.targetType === 'user')

  const [starVal, setStarVal] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
        <Nav />
        <div style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <Shield style={{ width: 48, height: 48, margin: '0 auto 20px', color: 'var(--text-faint)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>
            Profile Not Found
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No TrustNet profile exists for this ID.
          </p>
        </div>
      </div>
    )
  }

  const score = computeScore(userCreds)
  const avgStars = userRatings.length > 0
    ? userRatings.reduce((s, r) => s + r.stars, 0) / userRatings.length
    : 0
  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)
  const memberMonths = monthsSince(user.createdAt)

  const credCounts: Record<string, number> = {}
  for (const cred of userCreds) {
    credCounts[cred.credentialType] = (credCounts[cred.credentialType] ?? 0) + 1
  }

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
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--dark)', border: '3px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--gold-lt)' }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  {user.fullName}
                </h1>
                {user.idVerificationStatus === 'verified' && (
                  <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle style={{ width: 12, height: 12 }} /> Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', margin: '4px 0' }}>
                {user.profession}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>
                {user.location}, {user.country} · Member since {user.memberSince}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
                  <RatingDisplay avg={avgStars} count={userRatings.length} size={16} />
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="fade-up fade-up-1" style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Trust Score',     value: String(score.score) },
              { label: 'Credentials',     value: String(userCreds.length) },
              { label: 'Member Since',    value: user.memberSince },
              { label: 'Active Months',   value: `${memberMonths}` },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 20px', border: '1px solid rgba(255,255,255,.1)', minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold-lt)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Score breakdown */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <ScoreRing score={score.score} riskTier={score.riskTier} confidence={score.confidence} size={120} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Score Breakdown
                  </p>
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

            {/* About */}
            {user.bio && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>About</h3>
                <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7 }}>{user.bio}</p>
              </div>
            )}

            {/* Credentials summary */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
                Credentials <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({userCreds.length} active)</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(credCounts).map(([type, count]) => {
                  const Icon = CRED_ICON[type] ?? Shield
                  const accent = CRED_ACCENT[type] ?? 'var(--text-muted)'
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-lt)', background: 'var(--surface)' }}>
                      <Icon style={{ width: 15, height: 15, color: accent, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-mid)', textTransform: 'capitalize' }}>
                        {CRED_LABEL[type] ?? type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: accent }}>{count}</span>
                    </div>
                  )
                })}
                {userCreds.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No active credentials to display.</p>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
                Reviews <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({userRatings.length})</span>
              </h3>
              {userRatings.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No reviews yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {userRatings.map(rating => (
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

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Rate this person */}
            <div className="card" style={{ padding: 24, borderTop: '3px solid var(--gold)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
                Rate This Person
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
                      placeholder="Share your experience working with this person…"
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
