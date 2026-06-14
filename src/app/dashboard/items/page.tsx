'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { getStockStatus, cn } from '@/lib/utils'
import type { Item, Category, Profile } from '@/lib/types'

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category_id: '', beginning_inventory: '0', reorder_level: '0', remarks: '', no: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const supabaseRef = useState(() => createClient())[0]
  const supabase = supabaseRef

  async function loadData() {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('items').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    if (itemsRes.data) setItems(itemsRes.data.map((i: any) => ({ ...i, category_name: i.categories?.name })))
    if (catsRes.data) setCategories(catsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
    loadData()
  }, [])

  const isAdmin = profile?.role === 'admin'

  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter && i.category_id !== Number(catFilter)) return false
    return true
  })

  function openEdit(item: Item) {
    setForm({
      name: item.name,
      category_id: String(item.category_id || ''),
      beginning_inventory: String(item.beginning_inventory),
      reorder_level: String(item.reorder_level),
      remarks: item.remarks,
      no: String(item.no),
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  function openNew() {
    setForm({ name: '', category_id: '', beginning_inventory: '0', reorder_level: '0', remarks: '', no: String(items.length + 1) })
    setEditingId(null)
    setShowForm(true)
  }

  async function saveItem() {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      beginning_inventory: Number(form.beginning_inventory) || 0,
      stock_received: 0,
      total_dispensed: 0,
      reorder_level: Number(form.reorder_level) || 0,
      remarks: form.remarks.trim(),
      no: Number(form.no) || 0,
    }

    if (editingId) {
      // Don't overwrite stock_received/total_dispensed on edit
      await supabase.from('items').update(payload).eq('id', editingId)
    } else {
      await supabase.from('items').insert(payload)
    }
    setShowForm(false)
    loadData()
  }

  async function deleteItem(id: number) {
    if (!confirm('Delete this item permanently?')) return
    await supabase.from('items').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Items</h1>
          <p className="text-sm text-gray-500">{items.length} medicines registered</p>
        </div>
        {isAdmin && (
          <button onClick={openNew} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700">
            + Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Item list */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white py-12 text-center text-gray-400">No items found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Beginning</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-right">Dispensed</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-right">Reorder</th>
                <th className="px-4 py-3 text-center">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(item => {
                const status = getStockStatus(item.remaining_inventory, item.reorder_level)
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{item.no || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category_name || '—'}</td>
                    <td className="px-4 py-3 text-right">{item.beginning_inventory}</td>
                    <td className="px-4 py-3 text-right">{item.stock_received}</td>
                    <td className="px-4 py-3 text-right">{item.total_dispensed}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.remaining_inventory}</td>
                    <td className="px-4 py-3 text-right">{item.reorder_level || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-amber-400' : 'bg-emerald-400'
                      )} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(item)} className="mr-2 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
                        <button onClick={() => deleteItem(item.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Item' : 'Add Item'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Medicine Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Paracetamol 500mg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Category</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none">
                    <option value="">Select</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Item No.</label>
                  <input value={form.no} onChange={e => setForm({ ...form, no: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Beginning Inventory</label>
                  <input type="number" value={form.beginning_inventory} onChange={e => setForm({ ...form, beginning_inventory: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Reorder Level</label>
                  <input type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Remarks</label>
                <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveItem} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
