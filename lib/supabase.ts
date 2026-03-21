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
          issued_at: string
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
          issued_at?: string
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
          note: string | null
          created_at: string
        }
        Insert: {
          requester_id: string
          subject_id: string
          requester_company_id?: string | null
          consent_status?: string
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
