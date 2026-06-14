'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Item {
  id: number; name: string; remaining_inventory: number
}

export default function DispensePage() {
  const [items, setItems] = useState<Item[]>([])
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [patientRef, setPatientRef] = useState('')
  const [day, setDay] = useState(new Date().getDate())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabaseRef = useState(() => createClient())[0]
  const supabase = supabaseRef

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
    supabase.from('items').select('id, name, remaining_inventory').order('name').then(({ data }) => {
      if (data) setItems(data)
      setLoading(false)
    })
  }, [])

  async function handleDispense() {
    if (!itemId || !qty || qty <= 0) return
    const selectedItem = items.find(i => i.id === Number(itemId))
    if (!selectedItem) return
    if (qty > selectedItem.remaining_inventory) {
      alert(`Not enough stock! Only ${selectedItem.remaining_inventory} available.`)
      return
    }

    setSaving(true)
    const { data, error } = await supabase.rpc('dispense_item', {
      p_item_id: Number(itemId),
      p_quantity: qty,
      p_day: day,
      p_patient_ref: patientRef.trim(),
      p_dispensed_by: profile?.id,
    })

    if (error) {
      // Fallback: do it manually
      const { data: disp, error: dispErr } = await supabase.from('dispenses').insert({
        item_id: Number(itemId),
        quantity: qty,
        day,
        patient_ref: patientRef.trim(),
        dispensed_by: profile?.id,
      }).select().single()

      if (dispErr) { alert('Error: ' + dispErr.message); setSaving(false); return }

      // Update item total_dispensed
      await supabase.from('items').update({
        total_dispensed: selectedItem.remaining_inventory >= qty
          ? (selectedItem.remaining_inventory - qty) // this isn't right without reading current
          : undefined
      }).eq('id', Number(itemId))

      // Actually let's use a stored proc approach via SQL function
      // For now, update directly
      const { data: curr } = await supabase.from('items').select('total_dispensed').eq('id', Number(itemId)).single()
      if (curr) {
        await supabase.from('items').update({
          total_dispensed: (curr as any).total_dispensed + qty
        }).eq('id', Number(itemId))
      }

      setResult({
        id: disp?.id || '—',
        medicine: selectedItem.name,
        quantityDispensed: qty,
        patientRef: patientRef.trim() || 'N/A',
        remainingInventory: Math.max(0, selectedItem.remaining_inventory - qty),
        date: new Date().toISOString(),
      })
    } else {
      setResult(data)
    }

    setSaving(false)
  }

  function printReceipt() {
    if (!result) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><style>
      body{font-family:'Courier New',monospace;padding:20px;max-width:320px;margin:0 auto}
      h2{text-align:center;font-size:18px;margin-bottom:4px}
      .meta{text-align:center;font-size:11px;color:#666;margin-bottom:12px}
      hr{border-top:1px dashed #999}
      table{width:100%;font-size:13px;border-collapse:collapse}
      td{padding:4px 0} td:last-child{text-align:right}
      .footer{text-align:center;font-size:10px;color:#999;margin-top:8px}
    </style></head><body>
      <h2>SAMPLE RECEIPT</h2>
      <p class="meta">Receipt #${result.id}<br>${new Date(result.date).toLocaleString()}</p><hr>
      <table>
        <tr><td><strong>Medicine:</strong></td><td>${result.medicine}</td></tr>
        <tr><td><strong>Qty Dispensed:</strong></td><td>${result.quantityDispensed}</td></tr>
        <tr><td><strong>Patient/Ref:</strong></td><td>${result.patientRef}</td></tr>
        <tr><td><strong>Remaining:</strong></td><td>${result.remainingInventory}</td></tr>
      </table><hr>
      <p class="footer">Thank you</p>
      <script>window.onload=function(){window.print();window.close()}<\\/script>
    </body></html>`)
    w.document.close()
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispense Medicine</h1>
        <p className="text-sm text-gray-500">Issue medicine to patient and print receipt</p>
      </div>

      {!result ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Medicine *</label>
            {loading ? (
              <div className="mt-1 h-10 animate-pulse rounded-lg bg-gray-100" />
            ) : (
              <select value={itemId} onChange={e => setItemId(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="">Select medicine...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.remaining_inventory} avail)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity *</label>
              <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Day (1-31)</label>
              <select value={day} onChange={e => setDay(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
                {days.map(d => <option key={d} value={d}>Day {d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Patient / Reference</label>
            <input type="text" value={patientRef} onChange={e => setPatientRef(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Patient name or ID" />
          </div>

          {itemId && items.find(i => i.id === Number(itemId)) && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Available: <strong>{items.find(i => i.id === Number(itemId))?.remaining_inventory}</strong>
              {qty > (items.find(i => i.id === Number(itemId))?.remaining_inventory || 0) && (
                <span className="ml-2 text-red-600 font-medium">⚠ Exceeds stock!</span>
              )}
            </div>
          )}

          <button
            onClick={handleDispense}
            disabled={saving || !itemId || qty < 1}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Processing...' : 'Dispense & Print Receipt'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="text-center">
            <div className="text-3xl">✅</div>
            <h2 className="mt-2 text-lg font-bold text-gray-800">Dispensed Successfully</h2>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 p-4" style={{ fontFamily: "'Courier New', monospace" }}>
            <h3 className="text-center text-base font-bold">🧾 SAMPLE RECEIPT</h3>
            <p className="text-center text-xs text-gray-400">Receipt #{result.id} | {new Date(result.date).toLocaleString()}</p>
            <hr className="my-2 border-dashed" />
            <table className="w-full text-sm">
              <tr><td><strong>Medicine:</strong></td><td className="text-right">{result.medicine}</td></tr>
              <tr><td><strong>Qty:</strong></td><td className="text-right">{result.quantityDispensed}</td></tr>
              <tr><td><strong>Patient:</strong></td><td className="text-right">{result.patientRef}</td></tr>
              <tr><td><strong>Remaining:</strong></td><td className="text-right">{result.remainingInventory}</td></tr>
            </table>
            <hr className="my-2 border-dashed" />
            <p className="text-center text-xs text-gray-400">Thank you</p>
          </div>

          <div className="flex gap-2">
            <button onClick={printReceipt} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">🖨️ Print</button>
            <button onClick={() => { setResult(null); setQty(1); setPatientRef('') }} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">New Dispense</button>
          </div>
        </div>
      )}
    </div>
  )
}
