'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/useProfile'
import type { Profile, UserRole } from '@/lib/types'
import {
  PageHeader,
  StatusPill,
  Spinner,
  EmptyState,
  Modal,
  FieldShell,
  TextInput,
  SelectInput,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from '@/components/ui'
import { format } from 'date-fns'

interface NewUserForm {
  display_name: string
  email: string
  password: string
  role: UserRole
}

const EMPTY_FORM: NewUserForm = { display_name: '', email: '', password: '', role: 'staff' }

export default function UsersPage() {
  const supabase = createClient()
  const { profile, loading: profileLoading } = useProfile({
    requireAdmin: true,
    redirectTo: '/dashboard',
  })
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Add-user modal
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  // Delete confirmation
  const [toDelete, setToDelete] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profileLoading) return
    if (!profile) return
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load users', { description: error.message })
        if (data) setProfiles(data as Profile[])
        setLoading(false)
      })
  }, [supabase, profile, profileLoading])

  async function toggleRole(target: Profile) {
    if (!profile) return
    if (target.id === profile.id) {
      toast.error("You can't change your own role")
      return
    }
    const next = target.role === 'admin' ? 'staff' : 'admin'
    setBusyId(target.id)
    const { error } = await supabase
      .from('profiles')
      .update({ role: next })
      .eq('id', target.id)
    setBusyId(null)
    if (error) {
      toast.error('Update failed', { description: error.message })
      return
    }
    setProfiles(prev => prev.map(p => (p.id === target.id ? { ...p, role: next } : p)))
    toast.success(`${target.display_name} is now ${next}`)
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create user')

      const created: Profile = {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        role: data.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setProfiles(prev => [created, ...prev])
      toast.success(`${created.display_name} added as ${created.role}`)
      setAddOpen(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      toast.error('Could not add user', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setCreating(false)
    }
  }

  async function deleteUser() {
    if (!toDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(toDelete.id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete user')
      setProfiles(prev => prev.filter(p => p.id !== toDelete.id))
      toast.success(`${toDelete.display_name} removed`)
      setToDelete(null)
    } catch (err) {
      toast.error('Could not delete user', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleting(false)
    }
  }

  if (profileLoading || (loading && !profile)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" label="Checking access…" />
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    // Belt-and-suspenders: hook already redirects, but if not, render empty
    return null
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User management"
        description={`${profiles.length} registered user${profiles.length === 1 ? '' : 's'}`}
        actions={
          <PrimaryButton type="button" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add user
          </PrimaryButton>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label="Loading users…" />
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          title="No users yet"
          description="Add your first teammate with the button above."
        />
      ) : (
        <>
        {/* Mobile: stacked cards */}
        <ul className="space-y-2 sm:hidden">
          {profiles.map(p => {
            const isSelf = p.id === profile.id
            return (
              <li key={p.id} className="card card-pad">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">
                      {p.display_name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-ink-400">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-ink-600">{p.email}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      Joined {format(new Date(p.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <StatusPill variant={p.role === 'admin' ? 'admin' : 'staff'} label={p.role} />
                </div>
                {!isSelf && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => toggleRole(p)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                    >
                      {p.role === 'admin' ? (
                        <><ShieldOff className="h-3 w-3" /> Demote</>
                      ) : (
                        <><ShieldCheck className="h-3 w-3" /> Promote</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(p)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        {/* Desktop / tablet: table */}
        <div className="card hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-ink-50/60 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {profiles.map(p => {
                const isSelf = p.id === profile.id
                return (
                  <tr key={p.id} className="transition hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {p.display_name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-ink-400">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{p.email}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        variant={p.role === 'admin' ? 'admin' : 'staff'}
                        label={p.role}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {format(new Date(p.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <div className="text-right text-xs text-ink-400">—</div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => toggleRole(p)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                          >
                            {p.role === 'admin' ? (
                              <>
                                <ShieldOff className="h-3 w-3" /> Demote
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3 w-3" /> Promote
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(p)}
                            aria-label={`Delete ${p.display_name}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Add user modal */}
      <Modal
        open={addOpen}
        onClose={() => !creating && setAddOpen(false)}
        title="Add user"
        description="Create an account directly. The user can sign in immediately — no email confirmation needed."
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setAddOpen(false)} disabled={creating}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" form="add-user-form" disabled={creating}>
              {creating ? 'Adding…' : 'Add user'}
            </PrimaryButton>
          </>
        }
      >
        <form id="add-user-form" onSubmit={createUser} className="space-y-4">
          <FieldShell id="nu-name" label="Display name" required>
            <TextInput
              id="nu-name"
              required
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="Jane Cruz"
            />
          </FieldShell>
          <FieldShell id="nu-email" label="Email" required>
            <TextInput
              id="nu-email"
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@dglabs.com"
            />
          </FieldShell>
          <FieldShell id="nu-pass" label="Temporary password" hint="At least 8 characters" required>
            <TextInput
              id="nu-pass"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Share this with the user"
            />
          </FieldShell>
          <FieldShell id="nu-role" label="Role" hint="Admins manage items, categories, and users.">
            <SelectInput
              id="nu-role"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </SelectInput>
          </FieldShell>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        title="Delete user"
        description={
          toDelete
            ? `Permanently remove ${toDelete.display_name} (${toDelete.email}). This cannot be undone.`
            : ''
        }
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </SecondaryButton>
            <DangerButton type="button" onClick={deleteUser} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete user'}
            </DangerButton>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Their sign-in and profile will be removed. Dispense and stock history they recorded
          stays intact (attribution is cleared).
        </p>
      </Modal>
    </div>
  )
}
