'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

/**
 * Returns the current user's profile, or null until loaded.
 * If `requireAdmin` is true, the hook returns null and (optionally)
 * redirects away when the loaded profile is not an admin.
 */
export function useProfile(opts?: { requireAdmin?: boolean; redirectTo?: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        if (!cancelled) {
          setProfile(null)
          setLoading(false)
        }
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (cancelled) return
      setProfile((data as Profile | null) ?? null)
      setLoading(false)

      if (opts?.requireAdmin && data && data.role !== 'admin') {
        window.location.href = opts.redirectTo ?? '/dashboard'
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { profile, loading, isAdmin: profile?.role === 'admin' }
}
