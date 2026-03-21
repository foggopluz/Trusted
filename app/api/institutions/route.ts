import { financialInstitutions } from "@/lib/store"
import { FinancialInstitutionType } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") as FinancialInstitutionType | null

  let result = financialInstitutions
  if (type) result = result.filter(i => i.type === type)

  return Response.json({ institutions: result })
}
