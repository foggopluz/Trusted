'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StarRating from '@/app/components/StarRating'
import { createSupabaseBrowserClient } from '@/lib/supabase'

interface EndorseButtonProps {
  targetUserId: string
  targetName: string
}

type UIState = 'idle' | 'open' | 'submitting' | 'success' | 'not-logged-in' | 'error'

export default function EndorseButton({ targetUserId, targetName }: EndorseButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [uiState, setUiState] = useState<UIState>('idle')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
      setCheckingAuth(false)
    })
  }, [])

  // Hide button entirely if this is the user's own profile
  if (!checkingAuth && currentUserId === targetUserId) {
    return null
  }

  function handleOpen() {
    setUiState('open')
    setRating(0)
    setComment('')
    setErrorMsg('')
  }

  function handleCancel() {
    setUiState('idle')
    setRating(0)
    setComment('')
  }

  async function handleSubmit() {
    setErrorMsg('')

    const supabase = createSupabaseBrowserClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setUiState('not-logged-in')
      return
    }

    if (rating === 0) {
      setErrorMsg('Please select a star rating before submitting.')
      return
    }

    setUiState('submitting')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('endorsements') as any).upsert(
      {
        endorser_id: userData.user.id,
        subject_id: targetUserId,
        rating,
        comment: comment.trim() || null,
      },
      { onConflict: 'endorser_id,subject_id' }
    )

    if (error) {
      setErrorMsg('Something went wrong. Please try again.')
      setUiState('open')
      return
    }

    setUiState('success')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (uiState === 'success') {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--risk-low-bg)',
          border: '1px solid var(--risk-low)',
          color: 'var(--risk-low)',
          fontSize: 14,
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        Endorsement submitted! Thank you.
      </div>
    )
  }

  if (uiState === 'not-logged-in') {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--surface-2)',
          border: '1px solid var(--border-lt)',
          fontSize: 14,
          color: 'var(--text-mid)',
          textAlign: 'center',
        }}
      >
        Please{' '}
        <Link href="/login" style={{ color: 'var(--forest-mid)', fontWeight: 600, textDecoration: 'underline' }}>
          log in
        </Link>{' '}
        to endorse {targetName}.
      </div>
    )
  }

  return (
    <div>
      {/* Trigger button */}
      {uiState === 'idle' && (
        <button
          onClick={handleOpen}
          className="btn"
          style={{
            width: '100%',
            background: 'transparent',
            border: '2px solid var(--forest-mid)',
            color: 'var(--forest-mid)',
            fontWeight: 600,
            fontSize: 14,
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--forest-mid)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--forest-mid)'
          }}
        >
          Endorse {targetName}
        </button>
      )}

      {/* Inline form (open / submitting) */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: uiState === 'open' || uiState === 'submitting' ? 400 : 0,
          transition: 'max-height .3s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingTop: 4,
          }}
        >
          {/* Star selector */}
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block' }}>
              Your rating
            </label>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>

          {/* Comment */}
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block' }}>
              Comment{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-faint)', fontSize: 11 }}>(optional)</span>
            </label>
            <textarea
              className="input"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Share what made working with them great…"
              style={{ resize: 'vertical' }}
              disabled={uiState === 'submitting'}
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <p style={{ fontSize: 13, color: 'var(--risk-high)', margin: 0 }}>{errorMsg}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={uiState === 'submitting' || rating === 0}
              className="btn btn-gold"
              style={{
                opacity: uiState === 'submitting' || rating === 0 ? 0.55 : 1,
                cursor: uiState === 'submitting' || rating === 0 ? 'not-allowed' : 'pointer',
                flex: 1,
              }}
            >
              {uiState === 'submitting' ? 'Submitting…' : 'Submit Endorsement'}
            </button>
            <button
              onClick={handleCancel}
              disabled={uiState === 'submitting'}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 13,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 0',
                textDecoration: 'underline',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
