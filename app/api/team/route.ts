// Team Management API — business accounts can invite members with specific roles
//
// GET    /api/team?companyId=<uuid>   — list team members for a company
// POST   /api/team                    — invite a team member (owner only)
// PATCH  /api/team                    — update a member's role (owner only)
// DELETE /api/team?id=<uuid>          — remove a team member (owner only)
//
// Roles:
//   owner   — full control (assigned at company creation, not mutable)
//   admin   — can request trust checks, manage credentials, view audit logs
//   viewer  — read-only access to trust check results and scores

import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { audit } from '@/lib/audit'

const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export type TeamRole = 'owner' | 'admin' | 'viewer'

const MUTABLE_ROLES: TeamRole[] = ['admin', 'viewer']

async function requireOwner(
  request: Request,
  companyId: string,
): Promise<{ userId: string } | Response> {
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: company } = await serviceClient
    .from('companies')
    .select('owner_id')
    .eq('id', companyId)
    .single()

  if (!company) return Response.json({ error: 'Company not found' }, { status: 404 })
  if (company.owner_id !== user.id) return Response.json({ error: 'Forbidden — owner only' }, { status: 403 })

  return { userId: user.id }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return Response.json({ error: 'companyId is required' }, { status: 400 })

  if (IS_DEMO_MODE) return Response.json({ members: [] })

  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  // Verify the requesting user is a member (any role) of this company
  const { data: membership } = await serviceClient
    .from('team_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .single()

  // Also allow the owner even if they haven't created a team_members row yet
  const { data: company } = await serviceClient
    .from('companies')
    .select('owner_id')
    .eq('id', companyId)
    .single()

  if (!membership && company?.owner_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await serviceClient
    .from('team_members')
    .select('id, user_id, role, created_at, profiles(full_name, email)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ members: data ?? [] })
}

export async function POST(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ error: 'Team management requires Supabase' }, { status: 503 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { companyId, userId: inviteeId, role } = body

  if (!companyId || typeof companyId !== 'string') {
    return Response.json({ error: 'companyId is required' }, { status: 400 })
  }
  if (!inviteeId || typeof inviteeId !== 'string') {
    return Response.json({ error: 'userId is required' }, { status: 400 })
  }
  if (!role || !MUTABLE_ROLES.includes(role as TeamRole)) {
    return Response.json({
      error: `role must be one of: ${MUTABLE_ROLES.join(', ')}`,
    }, { status: 400 })
  }

  const ownerCheck = await requireOwner(request, companyId)
  if (ownerCheck instanceof Response) return ownerCheck
  const { userId: ownerId } = ownerCheck

  if (inviteeId === ownerId) {
    return Response.json({ error: 'Cannot add the owner as a team member' }, { status: 422 })
  }

  const serviceClient = createServiceClient()

  // Verify invitee exists
  const { data: invitee } = await serviceClient
    .from('profiles')
    .select('id, full_name')
    .eq('id', inviteeId)
    .single()
  if (!invitee) return Response.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await serviceClient
    .from('team_members')
    .upsert({ company_id: companyId, user_id: inviteeId, role }, { onConflict: 'company_id,user_id' })
    .select('id, user_id, role, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  audit({
    actorId: ownerId,
    action: 'team.member_added',
    targetType: 'company',
    targetId: companyId,
    metadata: { inviteeId, role },
  }).catch(() => {})

  return Response.json({ member: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ ok: true })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, companyId, role } = body

  if (!id || typeof id !== 'string')         return Response.json({ error: 'id is required' }, { status: 400 })
  if (!companyId || typeof companyId !== 'string') return Response.json({ error: 'companyId is required' }, { status: 400 })
  if (!role || !MUTABLE_ROLES.includes(role as TeamRole)) {
    return Response.json({ error: `role must be one of: ${MUTABLE_ROLES.join(', ')}` }, { status: 400 })
  }

  const ownerCheck = await requireOwner(request, companyId)
  if (ownerCheck instanceof Response) return ownerCheck
  const { userId: ownerId } = ownerCheck

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('team_members')
    .update({ role })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  audit({
    actorId: ownerId,
    action: 'team.role_changed',
    targetType: 'team_member',
    targetId: id,
    metadata: { companyId, newRole: role },
  }).catch(() => {})

  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (IS_DEMO_MODE) return Response.json({ ok: true })

  const { searchParams } = new URL(request.url)
  const id         = searchParams.get('id')
  const companyId  = searchParams.get('companyId')

  if (!id || !companyId) {
    return Response.json({ error: 'id and companyId are required' }, { status: 400 })
  }

  const ownerCheck = await requireOwner(request, companyId)
  if (ownerCheck instanceof Response) return ownerCheck
  const { userId: ownerId } = ownerCheck

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('team_members')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  audit({
    actorId: ownerId,
    action: 'team.member_removed',
    targetType: 'team_member',
    targetId: id,
    metadata: { companyId },
  }).catch(() => {})

  return Response.json({ ok: true })
}
