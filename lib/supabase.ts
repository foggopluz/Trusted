import { createClient } from '@supabase/supabase-js'

// Fallback placeholder values allow the build to complete without env vars.
// At runtime, real NEXT_PUBLIC_ values are used. Auth calls will simply fail
// gracefully if the vars are not configured (the app falls back to demo data).
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
