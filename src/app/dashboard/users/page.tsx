'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useState(() => createClient())[0]
  const supabase = supabaseRef
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.push('/auth/login')
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (!data || data.role !== 'admin') router.push('/dashboard')
        setCurrentUser(data)
      })
    })
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setProfiles(data)
      setLoading(false)
    })
  }, [])

  async function toggleRole(profile: Profile) {
    const newRole = profile.role === 'admin' ? 'staff' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id)
    if (error) alert('Error: ' + error.message)
    else setProfiles(profiles.map(p => p.id === profile.id ? { ...p, role: newRole as 'admin' | 'staff' } : p))
  }

  if (loading) return (
    <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500">{profiles.length} registered users</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.display_name}</td>
                <td className="px-4 py-3 text-gray-500">{p.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {currentUser?.id !== p.id && (
                    <button onClick={() => toggleRole(p)} className="rounded px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition">
                      Toggle to {p.role === 'admin' ? 'Staff' : 'Admin'}
                    </button>
                  )}
                  {currentUser?.id === p.id && (
                    <span className="text-xs text-gray-400">(you)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
