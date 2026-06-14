'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { getStockStatus } from '@/lib/utils'
import type { Item, Dispense } from '@/lib/types'

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([])
  const [recentDispenses, setRecentDispenses] = useState<Dispense[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useState(() => createClient())[0]
  const supabase = supabaseRef

  useEffect(() => {
    Promise.all([
      supabase.from('items').select('*, categories(name)').order('name'),
      supabase.from('dispenses').select('*, items(name)').order('created_at', { ascending: false }).limit(10),
    ]).then(([itemsRes, dispRes]) => {
      if (itemsRes.data) setItems(itemsRes.data.map((i: any) => ({ ...i, category_name: i.categories?.name })))
      if (dispRes.data) setRecentDispenses(dispRes.data.map((d: any) => ({ ...d, item_name: d.items?.name })))
      setLoading(false)
    })
  }, [])

  const critical = items.filter(i => getStockStatus(i.remaining_inventory, i.reorder_level) === 'critical')
  const low = items.filter(i => getStockStatus(i.remaining_inventory, i.reorder_level) === 'low')
  const categories = new Set(items.map(i => i.category_name).filter(Boolean)).size

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Inventory overview and quick actions</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Items', value: items.length, color: 'bg-blue-50 text-blue-700', icon: '💊' },
          { label: 'Categories', value: categories, color: 'bg-purple-50 text-purple-700', icon: '📂' },
          { label: 'Low Stock', value: low.length, color: 'bg-amber-50 text-amber-700', icon: '⚠️' },
          { label: 'Critical', value: critical.length, color: 'bg-red-50 text-red-700', icon: '🚨' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-lg">{stat.icon}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stat.color}`}>
                {stat.value}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Critical alerts */}
      {critical.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800">🚨 Critical Stock Alert</h3>
          <div className="mt-2 space-y-1">
            {critical.map(item => (
              <p key={item.id} className="text-sm text-red-700">
                <span className="font-medium">{item.name}</span> — only {item.remaining_inventory} remaining
                {item.reorder_level > 0 && ` (reorder at ${item.reorder_level})`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Low stock */}
      {low.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-800">⚠️ Low Stock Items</h3>
          <div className="mt-2 space-y-1">
            {low.slice(0, 5).map(item => (
              <p key={item.id} className="text-sm text-amber-700">
                <span className="font-medium">{item.name}</span> — {item.remaining_inventory} remaining
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Recent dispenses */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h3 className="font-semibold text-gray-800">Recent Dispenses</h3>
        </div>
        {recentDispenses.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No dispenses yet</div>
        ) : (
          <div className="divide-y">
            {recentDispenses.map(d => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{d.item_name || `Item #${d.item_id}`}</span>
                  <span className="ml-2 text-gray-400">×{d.quantity}</span>
                </div>
                <span className="text-gray-400 text-xs">
                  {d.patient_ref && `🚹 ${d.patient_ref} · `}
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a href="/dashboard/dispense" className="flex-1 min-w-[160px] rounded-xl border bg-white p-4 text-center shadow-sm transition hover:shadow-md hover:border-emerald-300">
          <div className="text-2xl">📤</div>
          <div className="mt-1 text-sm font-medium text-gray-700">Quick Dispense</div>
        </a>
        <a href="/dashboard/receive" className="flex-1 min-w-[160px] rounded-xl border bg-white p-4 text-center shadow-sm transition hover:shadow-md hover:border-emerald-300">
          <div className="text-2xl">📦</div>
          <div className="mt-1 text-sm font-medium text-gray-700">Receive Stock</div>
        </a>
        <a href="/dashboard/items" className="flex-1 min-w-[160px] rounded-xl border bg-white p-4 text-center shadow-sm transition hover:shadow-md hover:border-emerald-300">
          <div className="text-2xl">💊</div>
          <div className="mt-1 text-sm font-medium text-gray-700">Manage Items</div>
        </a>
      </div>
    </div>
  )
}
