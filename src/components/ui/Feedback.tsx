import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClass = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div role="status" className={cn('inline-flex items-center gap-3', className)}>
      <span
        aria-hidden
        className={cn(
          'inline-block animate-spin rounded-full',
          'border-clinic-500 border-t-transparent',
          sizeClass[size],
        )}
      />
      {label && <span className="text-sm text-ink-600">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </div>
  )
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" label={label ?? 'Loading…'} />
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'card card-pad flex flex-col items-center justify-center text-center',
        'py-12',
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
