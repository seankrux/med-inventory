import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for privileged admin operations
 * (creating/deleting auth users). Server-only — never import from a
 * Client Component. The service role key bypasses RLS, so every caller
 * must verify the requester is an admin first (see requireAdmin).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
