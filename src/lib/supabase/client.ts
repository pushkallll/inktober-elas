import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "dummy_supabase_url",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "dummy_supabase_publishable_key"
  )
}
