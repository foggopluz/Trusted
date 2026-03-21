'use client'
import { useEffect, useRef, useState } from 'react'

interface StepCardProps {
  number: string
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}

export default function StepCard({ number, icon, title, description, delay = 0 }: StepCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,0.68,0,1.2) ${delay}ms`,
      }}
    >
      {/* Large ghost numeral */}
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: -8,
          fontFamily: 'var(--font-display)',
          fontSize: 120,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.04)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {number}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 32 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--forest-pale)',
            marginBottom: 20,
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 500,
            color: 'var(--text)',
            marginBottom: 12,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--text-muted)',
            lineHeight: 1.75,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
