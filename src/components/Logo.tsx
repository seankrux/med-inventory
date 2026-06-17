'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * DG Labs Inventory mark.
 *
 * A rounded tile holding a stylised molecule (three bonded nodes) over a
 * single inventory "pulse" line. The pulse draws itself once on mount and
 * the top node breathes — both honour prefers-reduced-motion, in keeping
 * with the app's clinical, low-motion design language. See DESIGN.md.
 */
export function LogoMark({
  className,
  size = 32,
  animate = true,
}: {
  className?: string
  size?: number
  animate?: boolean
}) {
  // Unique gradient id per instance — multiple LogoMarks on one page (e.g. the
  // split-screen login) would otherwise collide on a shared id and break the
  // fill reference, especially when one instance is `display:none`.
  const tileId = `dg-tile-${useId()}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="DG Labs Inventory"
      className={cn(animate && 'dg-logo', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={tileId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-clinic-500)" />
          <stop offset="1" stopColor="var(--color-clinic-700)" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill={`url(#${tileId})`} />

      {/* bonds */}
      <g stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.92">
        <line x1="20" y1="12.5" x2="13" y2="23" />
        <line x1="20" y1="12.5" x2="27" y2="23" />
      </g>

      {/* nodes */}
      <circle className="dg-node-top" cx="20" cy="12.5" r="3.4" fill="white" />
      <circle cx="13" cy="24" r="2.8" fill="white" opacity="0.92" />
      <circle cx="27" cy="24" r="2.8" fill="white" opacity="0.92" />

      {/* inventory pulse */}
      <path
        className="dg-pulse"
        d="M8 32 H15 L17.5 27.5 L20.5 34.5 L23 32 H32"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}

/** Mark + wordmark, for headers and the sign-in screen. */
export function LogoLockup({
  className,
  markSize = 32,
  subtitle,
  animate = true,
}: {
  className?: string
  markSize?: number
  subtitle?: string
  animate?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={markSize} animate={animate} />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight text-ink-900">
          DG&nbsp;Labs <span className="text-clinic-700">Inventory</span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
