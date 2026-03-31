import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// ─── Database types ───────────────────────────────────────────────────────────
// Must include Relationships, Views, Functions, Enums, CompositeTypes to satisfy
// the GenericSchema constraint in @supabase/ssr and @supabase/supabase-js v2.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          country: string | null
          city: string | null
          profession: string | null
          account_type: string | null
          role: string
          verification_method: string | null
          id_number: string | null
          id_verification_status: string
          document_url: string | null
          did: string | null
          bio: string | null
          member_since: string | null
          trust_score: number | null
          privacy_settings: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          phone?: string | null
          country?: string | null
          city?: string | null
          profession?: string | null
          account_type?: string | null
          role?: string
          verification_method?: string | null
          id_number?: string | null
          id_verification_status?: string
          document_url?: string | null
          did?: string | null
          bio?: string | null
          member_since?: string | null
          trust_score?: number | null
          privacy_settings?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          owner_id: string
          business_name: string
          industry: string | null
          country: string | null
          city: string | null
          address: string | null
          website: string | null
          description: string | null
          tin_number: string | null
          registration_number: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          verification_status: string
          checks_remaining: number
          checks_used: number
          subscription_plan: string
          created_at: string
        }
        Insert: {
          owner_id: string
          business_name: string
          industry?: string | null
          country?: string | null
          city?: string | null
          address?: string | null
          website?: string | null
          description?: string | null
          tin_number?: string | null
          registration_number?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          verification_status?: string
          checks_remaining?: number
          checks_used?: number
          subscription_plan?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
        Relationships: []
      }
      credentials: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string | null
          description: string | null
          issuer_name: string | null
          issuer_type: string | null
          provenance_weight: number | null
          status: string
          confidence: number | null
          document_url: string | null
          proof_hash: string | null
          issued_at: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          title?: string | null
          description?: string | null
          issuer_name?: string | null
          issuer_type?: string | null
          provenance_weight?: number | null
          status?: string
          confidence?: number | null
          document_url?: string | null
          proof_hash?: string | null
          issued_at?: string
          expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['credentials']['Insert']>
        Relationships: []
      }
      trust_checks: {
        Row: {
          id: string
          requester_id: string
          subject_id: string
          requester_company_id: string | null
          consent_status: string
          score_at_check: number | null
          risk_tier: string | null
          credentials_shared: Json
          note: string | null
          created_at: string
        }
        Insert: {
          requester_id: string
          subject_id: string
          requester_company_id?: string | null
          consent_status?: string
          score_at_check?: number | null
          risk_tier?: string | null
          credentials_shared?: Json
          note?: string | null
        }
        Update: Partial<Database['public']['Tables']['trust_checks']['Insert']>
        Relationships: []
      }
      endorsements: {
        Row: {
          id: string
          endorser_id: string
          subject_id: string
          rating: number
          comment: string | null
          relationship: string | null
          created_at: string
        }
        Insert: {
          endorser_id: string
          subject_id: string
          rating: number
          comment?: string | null
          relationship?: string | null
        }
        Update: Partial<Database['public']['Tables']['endorsements']['Insert']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          target_type: string | null
          target_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          actor_id?: string | null
          action: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Json
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          company_id: string
          key_hash: string
          key_prefix: string
          name: string
          is_active: boolean
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          company_id: string
          key_hash: string
          key_prefix: string
          name: string
          is_active?: boolean
          last_used_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
        Relationships: []
      }
      disputes: {
        Row: {
          id: string
          credential_id: string
          filed_by: string
          reason: string
          evidence_url: string | null
          status: string
          resolution_note: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          credential_id: string
          filed_by: string
          reason: string
          evidence_url?: string | null
          status?: string
          resolution_note?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['disputes']['Insert']>
        Relationships: []
      }
      webhooks: {
        Row: {
          id: string
          company_id: string
          url: string
          secret: string
          events: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          company_id: string
          url: string
          secret: string
          events: string[]
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['webhooks']['Insert']>
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          id: string
          webhook_id: string
          event: string
          payload: Json
          status: string
          status_code: number | null
          response: string | null
          delivered_at: string
        }
        Insert: {
          webhook_id: string
          event: string
          payload: Json
          status?: string
          status_code?: number | null
          response?: string | null
        }
        Update: Partial<Database['public']['Tables']['webhook_deliveries']['Insert']>
        Relationships: []
      }
      scoring_config: {
        Row: {
          id: number
          factor_weights: Json
          risk_thresholds: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          factor_weights?: Json
          risk_thresholds?: Json
          updated_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['scoring_config']['Insert']>
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          company_id: string
          user_id: string
          role?: string
        }
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Convenience row types ────────────────────────────────────────────────────

export type ProfileRow     = Database['public']['Tables']['profiles']['Row']
export type CompanyRow     = Database['public']['Tables']['companies']['Row']
export type CredentialRow  = Database['public']['Tables']['credentials']['Row']
export type TrustCheckRow  = Database['public']['Tables']['trust_checks']['Row']
export type EndorsementRow = Database['public']['Tables']['endorsements']['Row']

// ─── Mode detection ───────────────────────────────────────────────────────────

export const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// ─── Browser client (for client components) ───────────────────────────────────

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}

// ─── Legacy named export (keeps existing imports working) ─────────────────────

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
)

// ─── Document Storage Helpers ─────────────────────────────────────────────────

const DOCUMENTS_BUCKET = 'documents'

/**
 * Upload a document to Supabase Storage.
 * Returns the storage path (e.g. "userId/id-doc.jpg") to store in the DB.
 * Throws on upload failure so callers can surface errors to the user.
 */
export async function uploadDocument(
  client: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
  file: File,
  filename = 'id-doc'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${filename}.${ext}`

  const { error } = await client.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: true })

  if (error) throw new Error(`Document upload failed: ${error.message}`)
  return path
}

/**
 * Generate a short-lived signed URL for a stored document path.
 * Default expiry: 1 hour (3600 seconds). Suitable for admin review flows.
 */
export async function getSignedDocumentUrl(
  client: ReturnType<typeof createSupabaseBrowserClient>,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null
  // If a legacy full URL was stored, return it as-is
  if (path.startsWith('http')) return path

  const { data, error } = await client.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error || !data) return null
  return data.signedUrl
}
