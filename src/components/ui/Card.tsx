import type { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={cn('card', className)} {...rest}>
      {children}
    </div>
  )
}
