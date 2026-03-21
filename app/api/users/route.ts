import { users } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country     = searchParams.get('country')
  const accountType = searchParams.get('accountType')
  const q           = searchParams.get('q')

  let result = users

  if (country)     result = result.filter(u => u.country === country)
  if (accountType) result = result.filter(u => u.accountType === accountType)
  if (q) {
    const lower = q.toLowerCase()
    result = result.filter(u =>
      u.fullName.toLowerCase().includes(lower) ||
      u.email?.toLowerCase().includes(lower) ||
      u.profession.toLowerCase().includes(lower)
    )
  }

  return Response.json({ users: result })
}
