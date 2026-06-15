'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/useProfile'
import type { Profile } from '@/lib/types'
import { PageHeader, StatusPill, Spinner, EmptyState } from '@/components/ui'
import { format } from 'date-fns'

export default function UsersPage() {
  const supabase = createClient()
  const { profile, loading: profileLoading } = useProfile({
    requireAdmin: true,
    redirectTo: '/dashboard',
  })
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

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
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label="Loading users…" />
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState title="No users yet" description="Profiles appear here after first sign-up." />
      ) : (
        <div className="card overflow-x-auto">
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
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-ink-400">—</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => toggleRole(p)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                        >
                          {p.role === 'admin' ? (
                            <>
                              <ShieldOff className="h-3 w-3" /> Demote to staff
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3" /> Promote to admin
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
