'use client'

import { useEffect, useRef, useState } from 'react'

interface Breakdown {
  employment: number
  payments: number
  endorsements: number
  identity: number
}

interface Props {
  score: number
  riskLevel: string
  riskTier: 'high' | 'medium' | 'low'
  breakdown: Breakdown
  animate?: boolean
}

const TIER_COLOR: Record<string, string> = {
  low:    '#22c55e',
  medium: '#f59e0b',
  high:   '#ef4444',
}

const BADGE_STYLE: Record<string, { background: string; color: string }> = {
  low:    { background: '#D1F0DC', color: '#1B6B3A' },
  medium: { background: '#FEF0CC', color: '#C07A0A' },
  high:   { background: '#FDDADA', color: '#B83232' },
}

const BAR_COLOR: Record<keyof Breakdown, string> = {
  employment:   '#4A90D9',
  payments:     '#2A7A50',
  endorsements: '#7B5EA7',
  identity:     '#C9900C',
}

const BAR_MAX: Record<keyof Breakdown, number> = {
  employment:   400,
  payments:     350,
  endorsements: 150,
  identity:     100,
}

const BAR_LABEL: Record<keyof Breakdown, string> = {
  employment:   'Employment',
  payments:     'Payments',
  endorsements: 'Endorsements',
  identity:     'Identity',
}

const BREAKDOWN_KEYS: (keyof Breakdown)[] = ['employment', 'payments', 'endorsements', 'identity']

export default function ScoreDisplay({
  score,
  riskLevel,
  riskTier,
  breakdown,
  animate = true,
}: Props) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const DURATION = 1500 // ms

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score)
      return
    }

    startTimeRef.current = null

    function step(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / DURATION, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [score, animate])

  const scoreColor = TIER_COLOR[riskTier] ?? '#6b7280'
  const badgeStyle = BADGE_STYLE[riskTier] ?? { background: '#e5e7eb', color: '#374151' }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '24px 20px',
      background: 'var(--card, #ffffff)',
      borderRadius: 16,
      border: '1px solid rgba(0,0,0,0.08)',
    }}>
      {/* Big score number */}
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <div style={{
          fontSize: 96,
          fontWeight: 700,
          color: scoreColor,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'var(--font-display, inherit)',
          transition: 'color 0.3s ease',
        }}>
          {displayScore}
        </div>
        <div style={{
          fontSize: 16,
          color: 'var(--muted, #9ca3af)',
          marginTop: 4,
        }}>
          / 1000
        </div>
      </div>

      {/* Risk badge */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        ...badgeStyle,
      }}>
        {riskLevel}
      </span>

      {/* Breakdown bars */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginTop: 4,
      }}>
        {BREAKDOWN_KEYS.map(key => {
          const pts = breakdown[key] ?? 0
          const max = BAR_MAX[key]
          const pct = Math.min((pts / max) * 100, 100)
          const barColor = BAR_COLOR[key]

          return (
            <div key={key}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--ink, #111827)',
                }}>
                  {BAR_LABEL[key]}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--muted, #6b7280)',
                }}>
                  {pts} pts
                </span>
              </div>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: 'rgba(0,0,0,0.07)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 4,
                  background: barColor,
                  transition: animate ? 'width 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
