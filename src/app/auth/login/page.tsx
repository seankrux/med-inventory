'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Must be SSR-safe — client is created lazily at interaction time
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authErr } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      setError('Check email for confirmation link. Then login.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white shadow-lg">⚕</div>
          <h1 className="text-2xl font-bold text-gray-900">Med Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">{mode === 'login' ? 'Sign in to your account' : 'Create an account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@clinic.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••" />
          </div>
          {error && (
            <div className={`rounded-lg p-3 text-sm ${error.includes('Check email') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>No account? <button onClick={() => { setMode('signup'); setError('') }} className="font-medium text-emerald-600 hover:underline">Sign up</button></>
          ) : (
            <>Already registered? <button onClick={() => { setMode('login'); setError('') }} className="font-medium text-emerald-600 hover:underline">Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}
