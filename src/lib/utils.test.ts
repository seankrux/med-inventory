import { describe, it, expect } from 'vitest'
import { cn, getStockStatus } from './utils'

describe('cn', () => {
  it('merges class names and dedupes tailwind utilities', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', false && 'text-lg', undefined, 'font-bold')).toBe('text-sm font-bold')
  })
})

describe('getStockStatus', () => {
  it('returns ok when no reorder level is set', () => {
    expect(getStockStatus(50, 0)).toBe('ok')
    expect(getStockStatus(50, -1)).toBe('ok')
  })

  it('returns critical when stock is at or below half the reorder level', () => {
    expect(getStockStatus(0, 10)).toBe('critical')
    expect(getStockStatus(5, 10)).toBe('critical')
  })

  it('returns low when stock is between half and full reorder level', () => {
    expect(getStockStatus(6, 10)).toBe('low')
    expect(getStockStatus(10, 10)).toBe('low')
  })

  it('returns ok when stock exceeds reorder level', () => {
    expect(getStockStatus(11, 10)).toBe('ok')
    expect(getStockStatus(999, 10)).toBe('ok')
  })
})
