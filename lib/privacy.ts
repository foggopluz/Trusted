// ─── Privacy Settings ─────────────────────────────────────────────────────────
//
// Controls what parts of a user's profile are visible to different audiences.
// Stored as a JSONB column `privacy_settings` on the profiles table.
//
// Visibility levels:
//   public   — anyone (including unauthenticated visitors and API callers)
//   verified — any authenticated user with a verified TrustNet profile
//   private  — only the profile owner and admins

export type VisibilityLevel = 'public' | 'verified' | 'private'

export interface PrivacySettings {
  score:        VisibilityLevel   // TrustScore and risk tier
  credentials:  VisibilityLevel   // Credential list
  contacts:     VisibilityLevel   // Phone number and email
  location:     VisibilityLevel   // City and country
  profession:   VisibilityLevel   // Profession / job title
  endorsements: VisibilityLevel   // Endorsements received
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  score:        'public',
  credentials:  'verified',
  contacts:     'private',
  location:     'public',
  profession:   'public',
  endorsements: 'public',
}

// ─── Check if viewer can see a field ──────────────────────────────────────────

export interface ViewerContext {
  isOwner:     boolean
  isAdmin:     boolean
  isVerified:  boolean   // authenticated user with a TrustNet profile
}

export function canView(
  field: keyof PrivacySettings,
  settings: Partial<PrivacySettings> | null | undefined,
  viewer: ViewerContext,
): boolean {
  if (viewer.isOwner || viewer.isAdmin) return true

  const level = settings?.[field] ?? DEFAULT_PRIVACY[field]
  if (level === 'public')   return true
  if (level === 'verified') return viewer.isVerified
  return false  // private
}

// ─── Filter a profile object by privacy settings ──────────────────────────────

export function applyPrivacyFilter<T extends Record<string, unknown>>(
  profile: T,
  settings: Partial<PrivacySettings> | null | undefined,
  viewer: ViewerContext,
): Partial<T> {
  const out = { ...profile }

  if (!canView('contacts',   settings, viewer)) {
    delete out.phone
    delete out.email
  }
  if (!canView('location',   settings, viewer)) {
    delete out.city
    delete out.country
  }
  if (!canView('profession', settings, viewer)) {
    delete out.profession
  }
  if (!canView('score',      settings, viewer)) {
    delete out.trust_score
  }

  return out
}

// ─── Validate incoming privacy settings update ────────────────────────────────

const VALID_LEVELS = new Set<string>(['public', 'verified', 'private'])
const VALID_FIELDS = new Set<string>(Object.keys(DEFAULT_PRIVACY))

export function validatePrivacySettings(
  input: unknown,
): { valid: true; settings: Partial<PrivacySettings> } | { valid: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'privacy_settings must be an object' }
  }

  const entries = Object.entries(input as Record<string, unknown>)
  const out: Partial<PrivacySettings> = {}

  for (const [key, val] of entries) {
    if (!VALID_FIELDS.has(key)) {
      return { valid: false, error: `Unknown field: ${key}. Valid fields: ${[...VALID_FIELDS].join(', ')}` }
    }
    if (!VALID_LEVELS.has(val as string)) {
      return { valid: false, error: `Invalid level "${val}" for "${key}". Use: public, verified, private` }
    }
    out[key as keyof PrivacySettings] = val as VisibilityLevel
  }

  return { valid: true, settings: out }
}
