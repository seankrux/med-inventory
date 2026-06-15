'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/useProfile'
import type { Category } from '@/lib/types'
import {
  PageHeader,
  FieldShell,
  TextInput,
  TextArea,
  PrimaryButton,
  SecondaryButton,
  Modal,
  Spinner,
  EmptyState,
} from '@/components/ui'

export default function CategoriesPage() {
  const supabase = createClient()
  const { isAdmin, loading: profileLoading } = useProfile()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (error) {
      toast.error('Failed to load categories', { description: error.message })
    }
    if (data) setCategories(data as Category[])
    setLoading(false)
  }

  useEffect(() => {
    // One-shot mount fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openNew() {
    setName('')
    setDescription('')
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setName(cat.name)
    setDescription(cat.description ?? '')
    setEditing(cat)
    setShowForm(true)
  }

  async function save() {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    const payload = { name: name.trim(), description: description.trim() }
    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload)
    setSaving(false)
    if (error) {
      toast.error('Save failed', { description: error.message })
      return
    }
    toast.success(editing ? 'Category updated' : 'Category added')
    setShowForm(false)
    setEditing(null)
    setName('')
    setDescription('')
    load()
  }

  async function remove(cat: Category) {
    if (
      !confirm(
        `Delete "${cat.name}"? Items in this category will be uncategorised, not deleted.`,
      )
    )
      return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) {
      toast.error('Delete failed', { description: error.message })
      return
    }
    toast.success('Category deleted')
    load()
  }

  if (!profileLoading && !isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Categories"
          description="Inventory groupings — only admins can manage."
        />
        <EmptyState
          title="Admin access required"
          description="Ask an admin to add or edit categories."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description={`${categories.length} group${categories.length === 1 ? '' : 's'} · shared across items`}
        actions={
          isAdmin ? (
            <PrimaryButton onClick={openNew}>
              <Plus className="h-4 w-4" /> Add category
            </PrimaryButton>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label="Loading categories…" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Group medicines by therapeutic class to make inventory easier to scan."
          action={
            isAdmin ? (
              <PrimaryButton onClick={openNew}>
                <Plus className="h-4 w-4" /> Add first category
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(cat => (
            <article key={cat.id} className="card card-pad group">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-clinic-50 text-clinic-700">
                  <FolderTree className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink-900">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">
                    {cat.description || 'No description'}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(cat)}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit category' : 'Add category'}
        footer={
          <>
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add category'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <FieldShell id="cat-name" label="Name" required>
            <TextInput
              id="cat-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Anti-microbial"
            />
          </FieldShell>
          <FieldShell id="cat-desc" label="Description" hint="Optional.">
            <TextArea
              id="cat-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What belongs in this category?"
            />
          </FieldShell>
        </div>
      </Modal>
    </div>
  )
}
