import { financialInstitutions } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country')
  const type    = searchParams.get('type')

  let result = financialInstitutions
  if (country) result = result.filter(i => i.country === country)
  if (type)    result = result.filter(i => i.type === type)

  return Response.json({ institutions: result })
}
