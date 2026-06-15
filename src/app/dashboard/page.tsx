'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pill, PackagePlus, PackageOpen, History, FolderTree } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getStockStatus } from '@/lib/utils'
import type { Item, Dispense } from '@/lib/types'
import {
  PageHeader,
  StatCard,
  StatusPill,
  Spinner,
  EmptyState,
} from '@/components/ui'

interface DashboardStats {
  total_items: number
  total_categories: number
  low_stock: number
  critical_stock: number
  total_dispensed_month: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [recent, setRecent] = useState<Dispense[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [itemsRes, dispRes, statsRes] = await Promise.all([
        supabase
          .from('items')
          .select('*, categories(name)')
          .order('name')
          .limit(500),
        supabase
          .from('dispenses')
          .select('*, items(name)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.rpc('dashboard_monthly_stats').maybeSingle<DashboardStats>(),
      ])
      if (cancelled) return

      if (itemsRes.data) {
        setItems(
          itemsRes.data.map((i: Item & { categories?: { name: string } | null }) => ({
            ...i,
            category_name: i.categories?.name,
          })),
        )
      }
      if (dispRes.data) {
        setRecent(
          dispRes.data.map((d: Dispense & { items?: { name: string } | null }) => ({
            ...d,
            item_name: d.items?.name,
          })),
        )
      }
      if (statsRes.error) {
        toast.error('Failed to load dashboard stats', { description: statsRes.error.message })
      } else if (statsRes.data) {
        setStats(statsRes.data as DashboardStats)
      }
      setLoading(false)
    }
    load().catch(err => {
      console.error(err)
      toast.error('Failed to load dashboard')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [supabase])

  if (loading || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" label="Loading dashboard…" />
      </div>
    )
  }

  const critical = items
    .filter(i => getStockStatus(i.remaining_inventory, i.reorder_level) === 'critical')
    .slice(0, 6)
  const low = items
    .filter(i => getStockStatus(i.remaining_inventory, i.reorder_level) === 'low')
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Inventory overview and quick actions"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total items"
          value={stats.total_items}
          icon={<Pill className="h-4 w-4" />}
          helper="In registry"
        />
        <StatCard
          label="Categories"
          value={stats.total_categories}
          tone="violet"
          icon={<FolderTree className="h-4 w-4" />}
        />
        <StatCard
          label="Low stock"
          value={stats.low_stock}
          tone="amber"
          icon={<History className="h-4 w-4" />}
        />
        <StatCard
          label="Critical"
          value={stats.critical_stock}
          tone="rose"
          icon={<Pill className="h-4 w-4" />}
          helper="Reorder now"
        />
        <StatCard
          label="Dispensed this month"
          value={stats.total_dispensed_month}
          tone="clinic"
          icon={<PackageOpen className="h-4 w-4" />}
          helper="Across all items"
        />
      </div>

      {critical.length > 0 && (
        <section className="card card-pad border-rose-200 bg-rose-50/60">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-rose-900">Critical stock</h2>
            <StatusPill variant="critical" label={`${stats.critical_stock} items`} />
          </div>
          <ul className="divide-y divide-rose-200/70">
            {critical.map(item => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href="/dashboard/items"
                  className="font-medium text-ink-900 hover:text-clinic-700"
                >
                  {item.name}
                </Link>
                <span className="text-ink-600">
                  <strong className="text-rose-700">{item.remaining_inventory}</strong>
                  <span className="text-ink-400"> remaining</span>
                  {item.reorder_level > 0 && (
                    <span className="text-ink-400"> · reorder at {item.reorder_level}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {low.length > 0 && (
        <section className="card card-pad border-amber-200 bg-amber-50/60">
          <h2 className="mb-3 text-sm font-semibold text-amber-900">Low stock</h2>
          <ul className="divide-y divide-amber-200/70">
            {low.map(item => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href="/dashboard/items"
                  className="font-medium text-ink-900 hover:text-clinic-700"
                >
                  {item.name}
                </Link>
                <span className="text-ink-600">
                  {item.remaining_inventory} remaining
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-ink-900">Recent dispenses</h2>
          <Link
            href="/dashboard/receipts"
            className="text-xs font-medium text-clinic-700 hover:text-clinic-800"
          >
            View all →
          </Link>
        </header>
        {recent.length === 0 ? (
          <EmptyState
            title="No dispenses yet"
            description="When staff dispense medicine, the latest entries will appear here."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {recent.map(d => (
              <li
                key={d.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">
                    {d.item_name || `Item #${d.item_id}`}
                  </p>
                  {d.patient_ref && (
                    <p className="truncate text-xs text-ink-500">
                      For {d.patient_ref}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-rose-600">×{d.quantity}</span>
                  <span className="text-xs text-ink-400">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-700">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickAction href="/dashboard/dispense" icon={<PackageOpen />} label="Dispense" />
          <QuickAction href="/dashboard/receive" icon={<PackagePlus />} label="Receive stock" />
          <QuickAction href="/dashboard/items" icon={<Pill />} label="Manage items" />
        </div>
      </section>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="card card-pad group flex items-center gap-3 transition hover:border-clinic-300 hover:shadow"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinic-50 text-clinic-700 transition group-hover:bg-clinic-100">
        {icon}
      </span>
      <span className="text-sm font-medium text-ink-800">{label}</span>
    </Link>
  )
}
