'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Item {
  id: number; name: string
}

export default function ReceivePage() {
  const [items, setItems] = useState<Item[]>([])
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const supabaseRef = useState(() => createClient())[0]
  const supabase = supabaseRef

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
    supabase.from('items').select('id, name').order('name').then(({ data }) => {
      if (data) setItems(data)
      setLoading(false)
    })
  }, [])

  async function handleReceive() {
    if (!itemId || !qty || qty <= 0) return
    setSaving(true)

    // Create stock receipt
    const { error: recErr } = await supabase.from('stock_receipts').insert({
      item_id: Number(itemId),
      quantity: qty,
      source: source.trim() || 'Unknown',
      received_by: profile?.id,
    })
    if (recErr) { alert('Error: ' + recErr.message); setSaving(false); return }

    // Update item stock_received
    const { data: curr } = await supabase.from('items').select('stock_received, total_dispensed').eq('id', Number(itemId)).single()
    if (curr) {
      const { error: updErr } = await supabase.from('items').update({
        stock_received: (curr as any).stock_received + qty,
      }).eq('id', Number(itemId))
      if (updErr) console.error('Update error:', updErr)
    }

    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">📦</div>
        <h2 className="mt-3 text-xl font-bold text-gray-800">Stock Received!</h2>
        <p className="mt-1 text-sm text-gray-500">Successfully logged to inventory.</p>
        <button onClick={() => { setDone(false); setItemId(''); setQty(1); setSource('') }}
          className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Receive More
        </button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receive Stock</h1>
        <p className="text-sm text-gray-500">Log incoming stock from suppliers</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Medicine *</label>
          {loading ? (
            <div className="mt-1 h-10 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <select value={itemId} onChange={e => setItemId(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
              <option value="">Select medicine...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity *</label>
          <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Source / Supplier</label>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" placeholder="e.g., Supplier name, donation, transfer" />
        </div>

        <button onClick={handleReceive} disabled={saving || !itemId || qty < 1}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Processing...' : '📦 Receive Stock'}
        </button>
      </div>
    </div>
  )
}
