import type { ReactNode } from 'react'

// The auth pages create a browser Supabase client during render, so they must
// not be statically prerendered at build time (where Supabase env vars are
// intentionally absent). Route segment config is honored here on the server
// layout and applies to all nested /auth segments.
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children
}
