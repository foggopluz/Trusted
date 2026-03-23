import { RatingDisplay } from '@/components/StarRating'

export interface EndorsementData {
  id?: string
  from_name: string
  rating: number
  comment: string
  created_at: string
}

interface EndorsementCardProps {
  endorsement: EndorsementData
}

export default function EndorsementCard({ endorsement }: EndorsementCardProps) {
  const date = new Date(endorsement.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        padding: 28,
        overflow: 'hidden',
      }}
    >
      {/* Decorative quotation mark */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -8,
          left: 16,
          fontSize: 80,
          lineHeight: 1,
          color: 'rgba(0,0,0,.06)',
          fontFamily: 'Georgia, serif',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        &ldquo;
      </span>

      {/* Comment */}
      <p
        style={{
          fontSize: 16,
          fontStyle: 'italic',
          color: 'var(--text-mid)',
          lineHeight: 1.65,
          margin: '20px 0 18px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {endorsement.comment || 'No comment provided.'}
      </p>

      {/* Star rating */}
      <div style={{ marginBottom: 14 }}>
        <RatingDisplay avg={endorsement.rating} count={1} size={15} />
      </div>

      {/* Author + date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14,
          borderTop: '1px solid var(--border-lt)',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--text)',
          }}
        >
          {endorsement.from_name}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-faint)',
          }}
        >
          {date}
        </span>
      </div>
    </div>
  )
}
