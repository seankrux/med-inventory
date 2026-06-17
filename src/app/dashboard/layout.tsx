import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'

// Dashboard routes are auth-gated and read live data through the browser
// Supabase client, so they must never be statically prerendered at build time
// (where Supabase env vars are intentionally absent). Applies to all nested
// segments under /dashboard.
export const dynamic = 'force-dynamic'

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
