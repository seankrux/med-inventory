'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Mail, Lock, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  FieldShell,
  TextInput,
  PrimaryButton,
  Toaster,
} from '@/components/ui'

export const dynamic = 'force-dynamic'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const { data, error: authErr } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (authErr) {
      setError(authErr.message)
      toast.error(authErr.message)
      setLoading(false)
      return
    }

    if (mode === 'signup' && !data.session) {
      // Email confirmation is enabled — no session yet, user must confirm.
      const message = 'Check your email to confirm the account, then sign in.'
      setInfo(message)
      toast.success(message)
      setMode('login')
      setLoading(false)
      return
    }

    // Signed in (login, or signup with auto-confirm) — go to the app.
    router.push('/dashboard')
  }

  return (
    <>
      <Toaster />
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div
              aria-hidden
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-clinic-600 text-white shadow-lg"
            >
              <Activity className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              Med Inventory
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {mode === 'login' ? 'Sign in to your clinic' : 'Create a clinic account'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card card-pad space-y-4"
            aria-label={mode === 'login' ? 'Sign in' : 'Create account'}
          >
            <FieldShell id="email" label="Email" required>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden
                />
                <TextInput
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-8"
                  placeholder="you@clinic.com"
                />
              </div>
            </FieldShell>
            <FieldShell id="password" label="Password" required>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden
                />
                <TextInput
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-8"
                  placeholder="••••••••"
                />
              </div>
            </FieldShell>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-sm text-sky-700"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{info}</span>
              </div>
            )}

            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </PrimaryButton>
          </form>

          <p className="mt-4 text-center text-sm text-ink-500">
            {mode === 'login' ? (
              <>
                New to the clinic?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                    setInfo(null)
                  }}
                  className="font-medium text-clinic-700 hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setInfo(null)
                  }}
                  className="font-medium text-clinic-700 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  )
}
