'use client'

interface StatItemProps {
  value: string
  label: string
}

export default function StatItem({ value, label }: StatItemProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="stat-num"
        style={{
          fontSize: 'clamp(32px, 4vw, 44px)',
          color: 'var(--gold-lt)',
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
    </div>
  )
}
