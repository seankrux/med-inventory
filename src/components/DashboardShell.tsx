'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Pill,
  PackageOpen,
  PackagePlus,
  History,
  Users,
  LogOut,
  Menu,
  X,
  Activity,
} from 'lucide-react'
import { useProfile } from '@/lib/useProfile'
import { cn } from '@/lib/utils'
import { StatusPill } from './ui/StatusPill'
import { Toaster } from './ui/Toaster'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { href: '/dashboard',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/items',      label: 'Items',       icon: Pill },
  { href: '/dashboard/dispense',   label: 'Dispense',    icon: PackageOpen },
  { href: '/dashboard/receive',    label: 'Receive',     icon: PackagePlus },
  { href: '/dashboard/receipts',   label: 'History',     icon: History },
  { href: '/dashboard/categories', label: 'Categories',  icon: Activity, adminOnly: true },
  { href: '/dashboard/users',      label: 'Users',       icon: Users,      adminOnly: true },
]

export function DashboardShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, loading } = useProfile()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const visibleNav = NAV.filter(n => !n.adminOnly || isAdmin)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Toaster />

      {/* Mobile overlay */}
      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-20 bg-ink-900/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-ink-200',
          'flex flex-col shadow-sm',
          'transition-transform duration-200 ease-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary navigation"
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-200 px-5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-clinic-600 text-white shadow-sm"
          >
            <Activity className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-ink-900">Med Inventory</span>
            <span className="text-[10px] uppercase tracking-wider text-ink-400">
              Clinic operations
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Sections">
          <ul className="space-y-0.5">
            {visibleNav.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2',
                      'text-sm transition-colors',
                      active
                        ? 'bg-clinic-50 text-clinic-700 font-medium'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-clinic-600' : 'text-ink-400 group-hover:text-ink-600',
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-ink-200 p-4">
          {loading ? (
            <div className="text-xs text-ink-400">Loading profile…</div>
          ) : profile ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800">
                  {profile.display_name}
                </p>
                <div className="mt-1">
                  <StatusPill
                    variant={isAdmin ? 'admin' : 'staff'}
                    label={profile.role}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="text-xs text-rose-500">Not signed in</div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-ink-600 hover:bg-ink-100"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-ink-800">Med Inventory</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
