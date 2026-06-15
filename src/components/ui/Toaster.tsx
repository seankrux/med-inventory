'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-ink-200 shadow-md text-sm font-medium',
          title: 'text-ink-900',
          description: 'text-ink-600',
        },
      }}
    />
  )
}
