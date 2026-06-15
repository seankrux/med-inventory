import { cn } from '@/lib/utils'

type Variant = 'ok' | 'low' | 'critical' | 'neutral' | 'info' | 'admin' | 'staff'

const variantClass: Record<Variant, string> = {
  ok:       'bg-clinic-50 text-clinic-700 ring-clinic-200',
  low:      'bg-amber-50 text-amber-700 ring-amber-200',
  critical: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral:  'bg-ink-100 text-ink-600 ring-ink-200',
  info:     'bg-sky-50 text-sky-700 ring-sky-200',
  admin:    'bg-violet-50 text-violet-700 ring-violet-200',
  staff:    'bg-ink-100 text-ink-600 ring-ink-200',
}

interface StatusPillProps {
  variant: Variant
  label: string
  className?: string
}

export function StatusPill({ variant, label, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium ring-1 ring-inset',
        variantClass[variant],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'ok'       && 'bg-clinic-500',
          variant === 'low'      && 'bg-amber-500',
          variant === 'critical' && 'bg-rose-500',
          variant === 'info'     && 'bg-sky-500',
          variant === 'admin'    && 'bg-violet-500',
          variant === 'staff'    && 'bg-ink-400',
          variant === 'neutral'  && 'bg-ink-400',
        )}
      />
      {label}
    </span>
  )
}
