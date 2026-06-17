'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Pill, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/useProfile'
import { getStockStatus } from '@/lib/utils'
import type { Category, Item } from '@/lib/types'
import {
  PageHeader,
  StatusPill,
  FieldShell,
  TextInput,
  SelectInput,
  PrimaryButton,
  SecondaryButton,
  Modal,
  Spinner,
  EmptyState,
} from '@/components/ui'

interface FormState {
  name: string
  category_id: string
  beginning_inventory: string
  reorder_level: string
  remarks: string
  no: string
}

const EMPTY_FORM: FormState = {
  name: '',
  category_id: '',
  beginning_inventory: '0',
  reorder_level: '0',
  remarks: '',
  no: '',
}

export default function ItemsPage() {
  const supabase = createClient()
  const { isAdmin, loading: profileLoading } = useProfile()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true)
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('items').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    if (itemsRes.error) toast.error('Failed to load items', { description: itemsRes.error.message })
    if (catsRes.error) toast.error('Failed to load categories', { description: catsRes.error.message })
    if (itemsRes.data) {
      setItems(
        itemsRes.data.map((i: Item & { categories?: { name: string } | null }) => ({
          ...i,
          category_name: i.categories?.name,
        })),
      )
    }
    if (catsRes.data) setCategories(catsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    // One-shot mount fetch — loadData() owns its own setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i => {
      if (q && !i.name.toLowerCase().includes(q)) return false
      if (catFilter && i.category_id !== Number(catFilter)) return false
      return true
    })
  }, [items, search, catFilter])

  function openNew() {
    setForm({ ...EMPTY_FORM, no: String(items.length + 1) })
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(item: Item) {
    setForm({
      name: item.name,
      category_id: String(item.category_id ?? ''),
      beginning_inventory: String(item.beginning_inventory),
      reorder_level: String(item.reorder_level),
      remarks: item.remarks,
      no: String(item.no ?? ''),
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error('Medicine name is required')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      beginning_inventory: Number(form.beginning_inventory) || 0,
      reorder_level: Number(form.reorder_level) || 0,
      remarks: form.remarks.trim(),
      no: Number(form.no) || 0,
    }
    const { error } = editingId
      ? await supabase.from('items').update(payload).eq('id', editingId)
      : await supabase.from('items').insert(payload)
    setSaving(false)
    if (error) {
      toast.error('Save failed', { description: error.message })
      return
    }
    toast.success(editingId ? 'Item updated' : 'Item added')
    setShowForm(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
    loadData()
  }

  async function remove(id: number) {
    if (!confirm('Delete this item permanently? Past dispenses and receipts will be cascaded.')) return
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) {
      toast.error('Delete failed', { description: error.message })
      return
    }
    toast.success('Item deleted')
    loadData()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory items"
        description={`${items.length} medicine${items.length === 1 ? '' : 's'} registered`}
        actions={
          isAdmin ? (
            <PrimaryButton onClick={openNew}>
              <Plus className="h-4 w-4" /> Add item
            </PrimaryButton>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <TextInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines…"
            className="pl-8"
            aria-label="Search medicines"
          />
        </div>
        <SelectInput
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          aria-label="Filter by category"
          className="min-w-[180px]"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectInput>
      </div>

      {profileLoading || (loading && items.length === 0) ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label="Loading items…" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'No items yet' : 'No matches'}
          description={
            items.length === 0
              ? 'Add your first medicine to start tracking inventory.'
              : 'Try a different search term or clear the filters.'
          }
          action={
            items.length === 0 && isAdmin ? (
              <PrimaryButton onClick={openNew}>
                <Plus className="h-4 w-4" /> Add first item
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <>
        {/* Mobile: stacked cards (tables scroll awkwardly on phones) */}
        <ul className="space-y-2 sm:hidden">
          {filtered.map(item => {
            const status = getStockStatus(item.remaining_inventory, item.reorder_level)
            return (
              <li key={item.id} className="card card-pad">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Pill className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                      <span className="font-medium text-ink-900">{item.name}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {item.category_name || 'No category'}
                      {item.remarks ? ` · ${item.remarks}` : ''}
                    </p>
                  </div>
                  <StatusPill variant={status} label={status} />
                </div>
                <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ['Begin', item.beginning_inventory],
                    ['Recv', item.stock_received],
                    ['Disp', item.total_dispensed],
                    ['Left', item.remaining_inventory],
                  ].map(([label, val]) => (
                    <div key={label as string} className="rounded-md bg-ink-50 py-1.5">
                      <dt className="text-[10px] uppercase tracking-wide text-ink-400">{label}</dt>
                      <dd className="text-sm font-semibold tabular-nums text-ink-900">{val}</dd>
                    </div>
                  ))}
                </dl>
                {isAdmin && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* Desktop / tablet: full table */}
        <div className="card hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-ink-50/60 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Begin</th>
                <th className="px-4 py-3 text-right">Recv</th>
                <th className="px-4 py-3 text-right">Disp</th>
                <th className="px-4 py-3 text-right">Left</th>
                <th className="px-4 py-3 text-right">Reorder</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map(item => {
                const status = getStockStatus(item.remaining_inventory, item.reorder_level)
                return (
                  <tr key={item.id} className="transition hover:bg-ink-50/60">
                    <td className="px-4 py-3 text-ink-400">{item.no || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Pill className="h-3.5 w-3.5 text-ink-400" aria-hidden />
                        <span className="font-medium text-ink-900">{item.name}</span>
                      </div>
                      {item.remarks && (
                        <p className="mt-0.5 text-xs text-ink-500">{item.remarks}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{item.category_name || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.beginning_inventory}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.stock_received}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.total_dispensed}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink-900">
                      {item.remaining_inventory}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-500">
                      {item.reorder_level || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill variant={status} label={status} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit item' : 'Add item'}
        footer={
          <>
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add item'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <FieldShell id="name" label="Medicine name" required>
            <TextInput
              id="name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Paracetamol 500 mg"
            />
          </FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell id="cat" label="Category">
              <SelectInput
                id="cat"
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Select…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </FieldShell>
            <FieldShell id="no" label="Item number">
              <TextInput
                id="no"
                type="number"
                value={form.no}
                onChange={e => setForm({ ...form, no: e.target.value })}
              />
            </FieldShell>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell
              id="begin"
              label="Beginning inventory"
              hint="On-hand at start. Locked once dispensed."
            >
              <TextInput
                id="begin"
                type="number"
                min={0}
                value={form.beginning_inventory}
                onChange={e =>
                  setForm({ ...form, beginning_inventory: e.target.value })
                }
                disabled={!!editingId}
              />
            </FieldShell>
            <FieldShell id="reorder" label="Reorder level">
              <TextInput
                id="reorder"
                type="number"
                min={0}
                value={form.reorder_level}
                onChange={e => setForm({ ...form, reorder_level: e.target.value })}
              />
            </FieldShell>
          </div>
          <FieldShell id="remarks" label="Remarks">
            <TextInput
              id="remarks"
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional"
            />
          </FieldShell>
        </div>
      </Modal>
    </div>
  )
}
