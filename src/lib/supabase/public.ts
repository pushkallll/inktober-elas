import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "dummy_supabase_url",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "dummy_supabase_publishable_key",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}
