'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ReceiptsPage() {
  const [tab, setTab] = useState<'dispense' | 'receipt'>('dispense')
  const [dispenses, setDispenses] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseRef = useState(() => createClient())[0]
  const supabase = supabaseRef

  useEffect(() => {
    Promise.all([
      supabase.from('dispenses').select('*, items(name), profiles(display_name)')
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('stock_receipts').select('*, items(name), profiles(display_name)')
        .order('created_at', { ascending: false }).limit(200),
    ]).then(([dRes, rRes]) => {
      if (dRes.data) setDispenses(dRes.data.map((d: any) => ({
        ...d, item_name: d.items?.name, by_name: d.profiles?.display_name || '—',
      })))
      if (rRes.data) setReceipts(rRes.data.map((r: any) => ({
        ...r, item_name: r.items?.name, by_name: r.profiles?.display_name || '—',
      })))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-sm text-gray-500">Complete audit trail of all inventory movements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button onClick={() => setTab('dispense')} className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === 'dispense' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          📤 Dispenses ({dispenses.length})
        </button>
        <button onClick={() => setTab('receipt')} className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === 'receipt' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          📦 Stock Received ({receipts.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'dispense' ? (
        dispenses.length === 0 ? (
          <div className="rounded-xl border bg-white py-12 text-center text-gray-400">No dispenses recorded</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dispenses.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.item_name || `#${d.item_id}`}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">-{d.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{d.patient_ref || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{d.month}/{d.day}/{d.year}</td>
                    <td className="px-4 py-3 text-gray-500">{d.by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        receipts.length === 0 ? (
          <div className="rounded-xl border bg-white py-12 text-center text-gray-400">No stock receipts recorded</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {receipts.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.item_name || `#${r.item_id}`}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">+{r.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{r.source}</td>
                    <td className="px-4 py-3 text-gray-500">{r.by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
