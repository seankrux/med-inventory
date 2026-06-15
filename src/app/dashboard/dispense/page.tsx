'use client'

import { useEffect, useMemo, useState } from 'react'
import { PackageOpen, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/useProfile'
import {
  PageHeader,
  FieldShell,
  SelectInput,
  TextInput,
  PrimaryButton,
  Spinner,
  StatusPill,
  EmptyState,
} from '@/components/ui'
import { Receipt, type ReceiptData } from '@/components/Receipt'
import { getStockStatus } from '@/lib/utils'

interface Item {
  id: number
  name: string
  remaining_inventory: number
  reorder_level: number
}

interface RpcSuccess {
  success: true
  receipt: ReceiptData & { date: string }
}
interface RpcFailure {
  success: false
  error: string
}
type RpcResult = RpcSuccess | RpcFailure

export default function DispensePage() {
  const supabase = createClient()
  const { profile, loading: profileLoading } = useProfile()

  const [items, setItems] = useState<Item[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [patientRef, setPatientRef] = useState('')
  const [day, setDay] = useState(new Date().getDate())
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  useEffect(() => {
    supabase
      .from('items')
      .select('id, name, remaining_inventory, reorder_level')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load items', { description: error.message })
        }
        if (data) setItems(data as Item[])
        setItemsLoading(false)
      })
  }, [supabase])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => i.name.toLowerCase().includes(q))
  }, [items, query])

  const selected = items.find(i => String(i.id) === itemId)
  const overStock = !!selected && qty > selected.remaining_inventory
  const disabled =
    saving || itemsLoading || profileLoading || !itemId || qty < 1 || overStock

  async function handleDispense() {
    if (!selected || !profile) return
    setSaving(true)
    const { data, error } = await supabase.rpc('dispense_item', {
      p_item_id: selected.id,
      p_quantity: qty,
      p_day: day,
      p_patient_ref: patientRef.trim(),
      p_dispensed_by: profile.id,
    })

    if (error) {
      toast.error('Could not dispense', { description: error.message })
      setSaving(false)
      return
    }

    const result = data as RpcResult | null
    if (!result || result.success !== true) {
      toast.error('Could not dispense', {
        description: result?.error ?? 'The dispense function returned an unexpected result.',
      })
      setSaving(false)
      return
    }

    setItems(prev =>
      prev.map(i =>
        i.id === selected.id
          ? { ...i, remaining_inventory: result.receipt.remainingInventory }
          : i,
      ),
    )
    setReceipt(result.receipt)
    setSaving(false)
    toast.success(`Dispensed ×${qty} of ${selected.name}`)
  }

  function reset() {
    setReceipt(null)
    setQty(1)
    setPatientRef('')
    setItemId('')
    setQuery('')
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <PageHeader
          title="Dispensed"
          description="Transaction recorded. You can print the receipt for the patient."
        />
        <Receipt data={receipt} onClose={reset} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Dispense medicine"
        description="Issue a unit to a patient and decrement stock atomically."
      />

      <div className="card card-pad space-y-4">
        {itemsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" label="Loading items…" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No items yet"
            description="Add medicines to your inventory before dispensing."
            action={
              <a
                href="/dashboard/items"
                className="inline-flex items-center gap-2 rounded-lg bg-clinic-600 px-4 py-2 text-sm font-medium text-white hover:bg-clinic-700"
              >
                <PackageOpen className="h-4 w-4" /> Go to items
              </a>
            }
          />
        ) : (
          <>
            <FieldShell id="medicine" label="Medicine" required>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden
                />
                <TextInput
                  type="search"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    if (itemId) setItemId('')
                  }}
                  placeholder="Search medicines…"
                  className="pl-8"
                  aria-label="Filter medicines"
                />
              </div>
              <SelectInput
                id="medicine"
                value={itemId}
                onChange={e => setItemId(e.target.value)}
                className="mt-2"
                aria-label="Select medicine"
              >
                <option value="">Select medicine…</option>
                {filteredItems.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {i.remaining_inventory} available
                  </option>
                ))}
              </SelectInput>
            </FieldShell>

            {selected && (
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs">
                <span className="text-ink-600">
                  Remaining: <strong className="text-ink-900">{selected.remaining_inventory}</strong>
                </span>
                <StatusPill
                  variant={getStockStatus(selected.remaining_inventory, selected.reorder_level)}
                  label={getStockStatus(selected.remaining_inventory, selected.reorder_level)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FieldShell id="qty" label="Quantity" required>
                <TextInput
                  id="qty"
                  type="number"
                  min={1}
                  max={selected?.remaining_inventory ?? undefined}
                  value={qty}
                  onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </FieldShell>
              <FieldShell id="day" label="Day of month">
                <SelectInput
                  id="day"
                  value={day}
                  onChange={e => setDay(Number(e.target.value))}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </SelectInput>
              </FieldShell>
            </div>

            <FieldShell
              id="patient"
              label="Patient or reference"
              hint="Optional. Use any short identifier the clinic uses internally."
            >
              <TextInput
                id="patient"
                value={patientRef}
                onChange={e => setPatientRef(e.target.value)}
                placeholder="Patient name or ID"
              />
            </FieldShell>

            {overStock && (
              <p role="alert" className="text-sm font-medium text-rose-600">
                Quantity exceeds remaining stock ({selected?.remaining_inventory}).
              </p>
            )}

            <PrimaryButton
              type="button"
              onClick={handleDispense}
              disabled={disabled}
              className="w-full"
            >
              <PackageOpen className="h-4 w-4" />
              {saving ? 'Processing…' : 'Dispense'}
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}
