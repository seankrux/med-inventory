import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStockStatus(remaining: number, reorderLevel: number): 'ok' | 'low' | 'critical' {
  if (!reorderLevel || reorderLevel <= 0) return 'ok'
  if (remaining <= 0) return 'critical'
  if (remaining <= reorderLevel) return remaining <= reorderLevel * 0.5 ? 'critical' : 'low'
  return 'ok'
}
