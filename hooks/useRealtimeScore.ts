'use client'

// ─── useRealtimeScore ─────────────────────────────────────────────────────────
//
// Subscribes to Supabase Realtime for credential and profile changes for the
// given userId, then re-fetches the score from /api/score when they fire.
//
// Usage:
//   const { score, riskTier, label, loading, lastUpdated } = useRealtimeScore(userId)
//
// Returns null score while loading. In demo mode, Realtime is not available
// so this hook falls back to a one-time fetch only.

import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient, IS_DEMO_MODE } from '@/lib/supabase'

export interface RealtimeScoreState {
  score:        number | null
  riskTier:     'low' | 'medium' | 'high' | null
  label:        string | null
  confidence:   number | null
  loading:      boolean
  lastUpdated:  Date | null
}

export function useRealtimeScore(userId: string | null): RealtimeScoreState {
  const [state, setState] = useState<RealtimeScoreState>({
    score: null, riskTier: null, label: null, confidence: null,
    loading: true, lastUpdated: null,
  })

  // Deduplicate rapid-fire events (credentials can trigger multiple rows)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchScore() {
    if (!userId) return
    try {
      const res  = await fetch(`/api/score?userId=${encodeURIComponent(userId)}`)
      if (!res.ok) return
      const data = await res.json() as {
        score: number; tier: string; label: string; confidence: number
      }
      setState({
        score:       data.score,
        riskTier:    data.tier as 'low' | 'medium' | 'high',
        label:       data.label,
        confidence:  data.confidence,
        loading:     false,
        lastUpdated: new Date(),
      })
    } catch {
      setState(s => ({ ...s, loading: false }))
    }
  }

  function scheduleFetch() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchScore, 300)
  }

  useEffect(() => {
    if (!userId) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    // Initial fetch
    fetchScore()

    if (IS_DEMO_MODE) return  // Realtime not available without Supabase

    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel(`score-${userId}`)
      // Re-score when a credential is added, approved, or rejected
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credentials', filter: `user_id=eq.${userId}` },
        scheduleFetch,
      )
      // Re-score when trust_score column updates directly
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        scheduleFetch,
      )
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return state
}
