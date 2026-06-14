'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/items', label: 'Items', icon: '💊' },
  { href: '/dashboard/dispense', label: 'Dispense', icon: '📤' },
  { href: '/dashboard/receive', label: 'Receive Stock', icon: '📦' },
  { href: '/dashboard/receipts', label: 'History', icon: '📋' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/login')
      else supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">⚕</span>
          <span className="font-bold text-gray-800">Med Inventory</span>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </a>
            )
          })}
          {profile?.role === 'admin' && (
            <a
              href="/dashboard/users"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                pathname.startsWith('/dashboard/users') ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>👥</span> Users
            </a>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-gray-700">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role || '—'}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-semibold text-gray-800">Med Inventory</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
