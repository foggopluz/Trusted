import { ratings } from '@/lib/store'
import type { Rating } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase-server'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetId   = searchParams.get('targetId')
  const targetType = searchParams.get('targetType')

  let result = ratings
  if (targetId)   result = result.filter(r => r.targetId === targetId)
  if (targetType) result = result.filter(r => r.targetType === targetType)

  return Response.json({ ratings: result })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { raterId, raterName, targetId, targetType, stars, comment } = body

    if (!targetId) return Response.json({ error: 'targetId is required' }, { status: 400 })
    if (!stars || stars < 1 || stars > 5) {
      return Response.json({ error: 'stars must be between 1 and 5' }, { status: 400 })
    }

    const newRating: Rating = {
      id:         `r-${Date.now()}`,
      raterId:    raterId   ?? 'anonymous',
      raterName:  raterName ?? 'Anonymous',
      targetId,
      targetType: targetType ?? 'user',
      stars:      Number(stars),
      comment:    comment   || undefined,
      createdAt:  new Date().toISOString().split('T')[0],
    }

    if (IS_DEMO_MODE) {
      ratings.push(newRating)
      return Response.json({ rating: newRating }, { status: 201 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('endorsements')
      .insert({
        endorser_id: newRating.raterId,
        subject_id:  newRating.targetId,
        rating:      newRating.stars,
        comment:     newRating.comment ?? null,
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    // Return a Rating-shaped object; use the DB-generated id if available
    const saved: Rating = { ...newRating, id: data.id ?? newRating.id }
    return Response.json({ rating: saved }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create rating' }, { status: 500 })
  }
}
