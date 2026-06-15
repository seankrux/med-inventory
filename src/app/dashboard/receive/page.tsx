'use client'

import { useEffect, useState } from 'react'
import { PackagePlus, Check } from 'lucide-react'
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
  EmptyState,
  Card,
} from '@/components/ui'

interface Item {
  id: number
  name: string
  stock_received: number
}

interface RpcSuccess {
  success: true
  receipt: {
    id: number
    item_id: number
    item_name: string
    quantity: number
    source: string
    new_stock_received: number
    new_remaining: number
    date: string
  }
}
interface RpcFailure {
  success: false
  error: string
}

export default function ReceivePage() {
  const supabase = createClient()
  const { profile, loading: profileLoading } = useProfile()

  const [items, setItems] = useState<Item[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [source, setSource] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ name: string; qty: number; newRemaining: number } | null>(null)

  useEffect(() => {
    supabase
      .from('items')
      .select('id, name, stock_received')
      .order('name')
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load items', { description: error.message })
        if (data) setItems(data as Item[])
        setItemsLoading(false)
      })
  }, [supabase])

  const selected = items.find(i => String(i.id) === itemId)
  const disabled = saving || itemsLoading || profileLoading || !itemId || qty < 1

  async function handleReceive() {
    if (!selected || !profile) return
    setSaving(true)

    const { data, error } = await supabase.rpc('receive_stock', {
      p_item_id: selected.id,
      p_quantity: qty,
      p_source: source.trim() || 'Unknown',
      p_received_by: profile.id,
    })

    if (error) {
      toast.error('Could not record receipt', { description: error.message })
      setSaving(false)
      return
    }

    const result = data as RpcSuccess | RpcFailure | null
    if (!result || result.success !== true) {
      toast.error('Could not record receipt', {
        description: result?.error ?? 'Unexpected result from the receive_stock function.',
      })
      setSaving(false)
      return
    }

    setItems(prev =>
      prev.map(i =>
        i.id === selected.id
          ? { ...i, stock_received: result.receipt.new_stock_received }
          : i,
      ),
    )
    setDone({
      name: selected.name,
      qty,
      newRemaining: result.receipt.new_remaining,
    })
    setSaving(false)
    toast.success(`Received ×${qty} of ${selected.name}`)
  }

  function reset() {
    setDone(null)
    setItemId('')
    setQty(1)
    setSource('')
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <PageHeader
          title="Stock received"
          description="The receipt was recorded and stock has been updated."
        />
        <Card>
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clinic-50 text-clinic-700">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <h2 className="text-lg font-semibold text-ink-900">Receipt logged</h2>
            <p className="text-sm text-ink-500">
              Added <strong className="text-ink-900">×{done.qty}</strong> of{' '}
              <strong className="text-ink-900">{done.name}</strong> to inventory.
            </p>
            <p className="text-xs text-ink-500">
              New on-hand quantity: <strong className="text-ink-900">{done.newRemaining}</strong>
            </p>
            <PrimaryButton onClick={reset} className="mt-3">
              <PackagePlus className="h-4 w-4" /> Receive more
            </PrimaryButton>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Receive stock"
        description="Log an incoming delivery or transfer. Stock is incremented atomically."
      />

      <div className="card card-pad space-y-4">
        {itemsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" label="Loading items…" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No items yet"
            description="Add medicines to your inventory before receiving stock."
          />
        ) : (
          <>
            <FieldShell id="item" label="Medicine" required>
              <SelectInput
                id="item"
                value={itemId}
                onChange={e => setItemId(e.target.value)}
              >
                <option value="">Select medicine…</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {i.stock_received} received so far
                  </option>
                ))}
              </SelectInput>
            </FieldShell>

            <FieldShell id="qty" label="Quantity" required>
              <TextInput
                id="qty"
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
            </FieldShell>

            <FieldShell
              id="source"
              label="Source / supplier"
              hint="Optional. e.g. supplier name, donation, transfer."
            >
              <TextInput
                id="source"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g. Supplier, donation, transfer"
              />
            </FieldShell>

            <PrimaryButton
              type="button"
              onClick={handleReceive}
              disabled={disabled}
              className="w-full"
            >
              <PackagePlus className="h-4 w-4" />
              {saving ? 'Processing…' : 'Receive stock'}
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}
