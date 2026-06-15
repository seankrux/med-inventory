'use client'

import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from './ui/FormField'

export interface ReceiptData {
  id: number | string
  medicine: string
  quantityDispensed: number
  patientRef: string
  remainingInventory: number
  date: string | Date
}

interface ReceiptProps {
  data: ReceiptData
  onClose: () => void
}

export function Receipt({ data, onClose }: ReceiptProps) {
  const ref = useRef<HTMLDivElement>(null)
  const date =
    typeof data.date === 'string' ? new Date(data.date) : data.date

  function print() {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        className="print-receipt mx-auto max-w-xs rounded-lg border border-dashed border-ink-300 bg-white p-5 font-mono text-sm"
        style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
      >
        <h3 className="text-center text-base font-bold tracking-wide text-ink-900">
          DISPENSE RECEIPT
        </h3>
        <p className="text-center text-[10px] text-ink-400">
          Receipt #{data.id} · {date.toLocaleString()}
        </p>
        <hr className="my-3 border-dashed border-ink-300" />
        <dl className="space-y-1.5">
          <div className="flex justify-between">
            <dt className="font-semibold">Medicine</dt>
            <dd className="text-right">{data.medicine}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold">Quantity</dt>
            <dd className="text-right">×{data.quantityDispensed}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold">Patient</dt>
            <dd className="text-right">{data.patientRef || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold">Remaining</dt>
            <dd className="text-right">{data.remainingInventory}</dd>
          </div>
        </dl>
        <hr className="my-3 border-dashed border-ink-300" />
        <p className="text-center text-[10px] text-ink-400">Thank you</p>
      </div>
      <div className="flex gap-2">
        <PrimaryButton onClick={print} className="flex-1">
          <Printer className="h-4 w-4" /> Print
        </PrimaryButton>
        <SecondaryButton onClick={onClose} className="flex-1">
          New dispense
        </SecondaryButton>
      </div>
    </div>
  )
}
