'use client'
import { useState } from 'react'

interface StarRatingProps {
  value: number             // current rating (1–5)
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}

export default function StarRating({ value, onChange, readonly = false, size = 18 }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-0.5" style={{ lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => i + 1).map(star => {
        const filled = (hover || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            style={{
              background: 'none', border: 'none', padding: '1px',
              cursor: readonly ? 'default' : 'pointer',
              color: filled ? 'var(--gold)' : 'var(--border)',
              fontSize: size,
              lineHeight: 1,
              transition: 'color .12s',
            }}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

// Read-only display: shows star icons, numeric average, and review count
export function RatingDisplay({ avg, count, size = 16 }: { avg: number; count: number; size?: number }) {
  const full = Math.floor(avg)
  const partial = avg % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - partial

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`} style={{ color: 'var(--gold)', fontSize: size }}>★</span>
        ))}
        {partial === 1 && (
          <span style={{ color: 'var(--gold)', fontSize: size, opacity: 0.5 }}>★</span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} style={{ color: 'var(--border)', fontSize: size }}>★</span>
        ))}
      </div>
      <span style={{ fontSize: size - 2, fontWeight: 600, color: 'var(--text-mid)' }}>
        {avg.toFixed(1)}
      </span>
      <span style={{ fontSize: size - 3, color: 'var(--text-muted)' }}>
        ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  )
}
