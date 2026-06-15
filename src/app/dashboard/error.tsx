'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/FormField'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg pt-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink-900">Something went wrong</h2>
      <p className="mt-1 text-sm text-ink-500">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-ink-400">digest: {error.digest}</p>
      )}
      <div className="mt-6">
        <PrimaryButton onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Try again
        </PrimaryButton>
      </div>
    </div>
  )
}
