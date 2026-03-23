'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, MapPin, Loader2 } from 'lucide-react'
import { RatingDisplay } from '@/components/StarRating'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserCardData {
  id: string
  fullName: string
  profession: string
  location: string
  country: string
  score: number
  riskTier: 'low' | 'medium' | 'high'
  confidence: string
  credentialCount: number
  ratingAvg: number | null
  ratingCount: number
  accountType: string
}

interface Props {
  user: UserCardData
  alreadyRequested: boolean
  onRequestCheck: (userId: string) => void
  onViewProfile: (userId: string) => void
  isProfileOpen: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  Tanzania: '🇹🇿',
  Kenya:    '🇰🇪',
  Uganda:   '🇺🇬',
  Ghana:    '🇬🇭',
  Nigeria:  '🇳🇬',
  Rwanda:   '🇷🇼',
}

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🌍'
}

function getAvatarBg(tier: string): string {
  if (tier === 'low')    return 'var(--risk-low)'
  if (tier === 'medium') return '#B07010'
  return 'var(--risk-high)'
}

function getScoreColor(score: number): string {
  if (score >= 700) return 'var(--risk-low)'
  if (score >= 450) return 'var(--risk-med)'
  return 'var(--risk-high)'
}

function getRiskBadgeStyle(tier: string): React.CSSProperties {
  if (tier === 'low')    return { background: 'var(--risk-low-bg)',  color: 'var(--risk-low)'  }
  if (tier === 'medium') return { background: 'var(--risk-med-bg)',  color: 'var(--risk-med)'  }
  return                        { background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }
}

type RequestState = 'idle' | 'loading' | 'done'

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserSearchCard({ user, alreadyRequested, onRequestCheck, onViewProfile, isProfileOpen }: Props) {
  const [reqState, setReqState] = useState<RequestState>(alreadyRequested ? 'done' : 'idle')

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const avatarBg = getAvatarBg(user.riskTier)

  function handleRequest(e: React.MouseEvent) {
    e.stopPropagation()
    if (reqState !== 'idle') return
    setReqState('loading')
    setTimeout(() => {
      setReqState('done')
      onRequestCheck(user.id)
    }, 1400)
  }

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 24,
        boxShadow: isProfileOpen
          ? '0 0 0 2px var(--gold), 0 2px 16px rgba(0,0,0,.06)'
          : '0 2px 16px rgba(0,0,0,.06)',
        background: 'var(--white)',
        border: isProfileOpen ? '1.5px solid var(--gold)' : '1.5px solid var(--border-lt)',
        transition: 'box-shadow .2s, border-color .2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Top row: avatar + identity + score */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: avatarBg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff',
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
          boxShadow: `0 0 0 3px ${avatarBg}33`,
        }}>
          {initials}
        </div>

        {/* Name + profession + location */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              {user.fullName}
            </span>
            <CheckCircle style={{ width: 14, height: 14, color: 'var(--forest-mid)', flexShrink: 0 }} />
            <span
              className="badge"
              style={{
                background: 'rgba(27,94,59,.08)',
                color: 'var(--forest-mid)',
                fontSize: 10,
                textTransform: 'capitalize',
              }}
            >
              {user.accountType.replace('_', ' ')}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {user.profession}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <MapPin style={{ width: 11, height: 11, color: 'var(--text-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              {getFlag(user.country)} {user.location}, {user.country}
            </span>
          </div>
        </div>

        {/* Score block */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            color: getScoreColor(user.score),
            lineHeight: 1,
          }}>
            {user.score}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>/ 1000</div>
          <span
            className="badge"
            style={{ ...getRiskBadgeStyle(user.riskTier), marginTop: 6, display: 'inline-block', textTransform: 'capitalize' }}
          >
            {user.riskTier} risk
          </span>
        </div>
      </div>

      {/* Star rating row */}
      {user.ratingAvg !== null && user.ratingCount > 0 && (
        <div style={{ borderTop: '1px solid var(--border-lt)', paddingTop: 12 }}>
          <RatingDisplay avg={user.ratingAvg} count={user.ratingCount} size={14} />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={() => onViewProfile(user.id)}
          className="btn btn-outline-dark btn-sm"
          style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
        >
          {isProfileOpen ? 'Hide Profile' : 'View Full Profile'}
        </button>

        {reqState === 'idle' && (
          <button
            onClick={handleRequest}
            className="btn btn-gold btn-sm"
            style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
          >
            Request Trust Check
          </button>
        )}
        {reqState === 'loading' && (
          <button
            disabled
            className="btn btn-sm"
            style={{
              flex: 1, justifyContent: 'center', fontSize: 13,
              background: 'var(--gold-pale)', color: 'var(--gold)',
              border: '1px solid var(--gold-border)', cursor: 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
            Awaiting Consent…
          </button>
        )}
        {reqState === 'done' && (
          <div
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--risk-low)',
              background: 'var(--risk-low-bg)', borderRadius: 6, padding: '8px 14px',
            }}
          >
            <CheckCircle style={{ width: 14, height: 14 }} />
            Access Requested ✓
          </div>
        )}
      </div>
    </div>
  )
}
