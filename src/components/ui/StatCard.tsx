import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'clinic' | 'amber' | 'rose' | 'sky' | 'violet' | 'ink'

const toneClass: Record<Tone, string> = {
  clinic: 'bg-clinic-50 text-clinic-700',
  amber:  'bg-amber-50 text-amber-700',
  rose:   'bg-rose-50 text-rose-700',
  sky:    'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  ink:    'bg-ink-100 text-ink-700',
}

// The value is the hero of the card. Status tones (amber/rose) carry it through
// to the number so critical/low counts read with weight at a glance; neutral
// tones keep the calm near-black ink. See DESIGN.md §2 (functional color).
const valueClass: Record<Tone, string> = {
  clinic: 'text-ink-900',
  amber:  'text-amber-600',
  rose:   'text-rose-600',
  sky:    'text-ink-900',
  violet: 'text-ink-900',
  ink:    'text-ink-900',
}

// Critical/low cards get a faint tinted edge so they stand out in the grid
// without shouting — a 1px accent border, not a fill.
const edgeClass: Partial<Record<Tone, string>> = {
  amber: 'border-amber-200',
  rose:  'border-rose-200',
}

interface StatCardProps {
  label: string
  value: number | string
  tone?: Tone
  icon?: ReactNode
  helper?: string
  className?: string
}

export function StatCard({
  label,
  value,
  tone = 'ink',
  icon,
  helper,
  className,
}: StatCardProps) {
  return (
    <div className={cn('card card-pad', edgeClass[tone], className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-400">
          {label}
        </p>
        {icon && (
          <span
            aria-hidden
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              toneClass[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-2 text-3xl font-semibold tabular-nums tracking-tight',
          valueClass[tone],
        )}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {helper && <p className="mt-1 text-xs text-ink-400">{helper}</p>}
    </div>
  )
}
