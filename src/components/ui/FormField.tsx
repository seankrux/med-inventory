import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  id?: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FieldShell({ id, label, hint, error, required, className, children }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

const inputBase =
  'block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 ' +
  'placeholder:text-ink-400 shadow-sm ' +
  'focus:border-clinic-500 focus:ring-2 focus:ring-clinic-200 focus:outline-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'min-h-[80px]', className)} {...props} />
}

export function PrimaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
        'text-sm font-semibold text-white shadow-sm',
        'bg-clinic-600 hover:bg-clinic-700 active:bg-clinic-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition focus-visible:ring-2 focus-visible:ring-clinic-200 focus-visible:ring-offset-1',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
        'text-sm font-medium text-ink-700 bg-white border border-ink-200',
        'hover:bg-ink-50 active:bg-ink-100',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition focus-visible:ring-2 focus-visible:ring-ink-200 focus-visible:ring-offset-1',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DangerButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
        'text-sm font-medium text-white shadow-sm',
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-1',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
