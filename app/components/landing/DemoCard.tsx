'use client'
import { useEffect, useRef, useState } from 'react'

export default function DemoCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const target = 812

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const duration = 1400 // ms
    const steps = 60
    const increment = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, interval)
    return () => clearInterval(timer)
  }, [started])

  const checks = [
    'Verified Work History',
    'Payment Reliability',
    '8 Endorsements',
  ]

  return (
    <div
      ref={ref}
      className="card"
      style={{
        padding: '36px 32px',
        maxWidth: 360,
        width: '100%',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 16px 48px rgba(10,20,12,0.12)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = ''
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: 2,
            }}
          >
            Asha Mwinyi
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Verified Member
          </div>
        </div>
        {/* Avatar placeholder */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--forest-pale), var(--gold-pale))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--forest-mid)',
            border: '2px solid var(--border)',
          }}
        >
          AM
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 72,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: 4,
          }}
        >
          {count}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          Trust Score <span style={{ color: 'var(--text-faint)' }}>/ 1000</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="progress-track" style={{ marginBottom: 20 }}>
        <div
          className="progress-fill"
          style={{
            width: started ? `${(count / 1000) * 100}%` : '0%',
            transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)',
            background: 'linear-gradient(90deg, var(--forest-mid), var(--gold))',
          }}
        />
      </div>

      {/* Risk badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <span className="badge badge-low" style={{ fontSize: 12, padding: '5px 14px' }}>
          Very Low Risk
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

      {/* Check items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map(check => (
          <div
            key={check}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-mid)',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'var(--risk-low-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="var(--risk-low)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {check}
          </div>
        ))}
      </div>
    </div>
  )
}
