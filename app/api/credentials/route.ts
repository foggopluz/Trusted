import { credentials } from "@/lib/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const type = searchParams.get("type")

  let result = credentials
  if (userId) result = result.filter(c => c.subjectUserId === userId)
  if (type) result = result.filter(c => c.credentialType === type)

  return Response.json({ credentials: result })
}
