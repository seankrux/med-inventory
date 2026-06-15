import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
