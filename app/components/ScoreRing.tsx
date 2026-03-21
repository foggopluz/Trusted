'use client'
import { RiskTier } from "@/lib/types"

interface BreakdownBars {
  identity?: number       // 0–1
  financial?: number      // 0–1
  contracts?: number      // 0–1
  network?: number        // 0–1
}

interface Props {
  score: number
  riskTier: RiskTier
  confidence: string
  size?: number
  strokeWidth?: number
  breakdown?: BreakdownBars
}

const RING_COLOR: Record<RiskTier, string> = {
  low:    '#2A7A50',
  medium: '#C9900C',
  high:   '#B83232',
}

const BADGE_STYLE: Record<RiskTier, { bg: string; color: string }> = {
  low:    { bg: '#D1F0DC', color: '#1B6B3A' },
  medium: { bg: '#FEF0CC', color: '#C07A0A' },
  high:   { bg: '#FDDADA', color: '#B83232' },
}

const RISK_LABEL: Record<RiskTier, string> = {
  low:    'Low Risk',
  medium: 'Medium Risk',
  high:   'High Risk',
}

const BREAKDOWN_LABELS: Record<keyof BreakdownBars, string> = {
  identity:  'Identity',
  financial: 'Financial',
  contracts: 'Contracts',
  network:   'Network',
}

const BREAKDOWN_COLORS: Record<keyof BreakdownBars, string> = {
  identity:  '#4A90D9',
  financial: '#2A7A50',
  contracts: '#C9900C',
  network:   '#7B5EA7',
}

export default function ScoreRing({
  score,
  riskTier,
  confidence,
  size = 140,
  strokeWidth = 10,
  breakdown,
}: Props) {
  const r = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 1000) / 1000)
  const color = RING_COLOR[riskTier]
  const badge = BADGE_STYLE[riskTier]

  const breakdownEntries = breakdown
    ? (Object.keys(BREAKDOWN_LABELS) as (keyof BreakdownBars)[]).filter(
        k => breakdown[k] !== undefined
      )
    : []

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="rgba(12,26,17,.08)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)',
              filter: `drop-shadow(0 0 6px ${color}66)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.22,
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1,
          }}>
            {score}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>/ 1000</span>
        </div>
      </div>

      {/* Risk badge + confidence */}
      <div className="flex items-center gap-2">
        <span className="badge" style={{ background: badge.bg, color: badge.color }}>
          {RISK_LABEL[riskTier]}
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
          {confidence} confidence
        </span>
      </div>

      {/* Optional breakdown bars */}
      {breakdownEntries.length > 0 && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {breakdownEntries.map(key => {
            const val = breakdown![key] as number
            const pct = Math.round(Math.min(Math.max(val, 0), 1) * 100)
            const barColor = BREAKDOWN_COLORS[key]
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                    {BREAKDOWN_LABELS[key]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                    {pct}%
                  </span>
                </div>
                <div style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(12,26,17,.08)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 3,
                    background: barColor,
                    transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
