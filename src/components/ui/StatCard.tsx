import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { StatusPill } from './StatusPill'

type Tone = 'clinic' | 'amber' | 'rose' | 'sky' | 'violet' | 'ink'

const toneClass: Record<Tone, string> = {
  clinic: 'bg-clinic-50 text-clinic-700',
  amber:  'bg-amber-50 text-amber-700',
  rose:   'bg-rose-50 text-rose-700',
  sky:    'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  ink:    'bg-ink-100 text-ink-700',
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
    <div className={cn('card card-pad', className)}>
      <div className="flex items-center justify-between">
        {icon && (
          <span
            aria-hidden
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              toneClass[tone],
            )}
          >
            {icon}
          </span>
        )}
        <StatusPill
          variant={tone === 'rose' ? 'critical' : tone === 'amber' ? 'low' : 'neutral'}
          label={typeof value === 'number' ? value.toLocaleString() : value}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-ink-600">{label}</p>
      {helper && <p className="mt-0.5 text-xs text-ink-400">{helper}</p>}
    </div>
  )
}
