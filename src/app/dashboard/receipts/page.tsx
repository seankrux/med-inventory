'use client'

import { useEffect, useState, useCallback } from 'react'
import { PackageOpen, PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/useProfile'
import {
  PageHeader,
  StatusPill,
  Spinner,
  EmptyState,
  SecondaryButton,
} from '@/components/ui'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Tab = 'dispense' | 'receipt'

const PAGE_SIZE = 25

interface DispenseRow {
  id: number
  created_at: string
  item_name: string | null
  quantity: number
  patient_ref: string | null
  month: number
  day: number
  year: number
  by_name: string
}
interface ReceiptRow {
  id: number
  created_at: string
  item_name: string | null
  quantity: number
  source: string
  by_name: string
}

type DispenseDbRow = {
  id: number
  created_at: string
  quantity: number
  patient_ref: string | null
  month: number
  day: number
  year: number
  items: { name: string } | null
  profiles: { display_name: string } | null
}
type ReceiptDbRow = {
  id: number
  created_at: string
  quantity: number
  source: string
  items: { name: string } | null
  profiles: { display_name: string } | null
}

export default function HistoryPage() {
  const supabase = createClient()
  const { profile, loading: profileLoading } = useProfile()
  const [tab, setTab] = useState<Tab>('dispense')
  const [dispenses, setDispenses] = useState<DispenseRow[]>([])
  const [receipts, setReceipts] = useState<ReceiptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState({ dispense: true, receipt: true })
  const [loadingMore, setLoadingMore] = useState({ dispense: false, receipt: false })

  const load = useCallback(
    async (which: Tab, fromHead: boolean) => {
      if (which === 'dispense') {
        if (!fromHead && (!hasMore.dispense || loadingMore.dispense)) return
        if (fromHead) setLoading(true)
        else setLoadingMore(s => ({ ...s, dispense: true }))
        const from = fromHead ? 0 : dispenses.length
        const to = from + PAGE_SIZE - 1
        const { data, error } = await supabase
          .from('dispenses')
          .select('*, items(name), profiles(display_name)')
          .order('created_at', { ascending: false })
          .range(from, to)
        if (error) {
          toast.error('Failed to load history', { description: error.message })
        } else if (data) {
          const rows: DispenseRow[] = (data as unknown as DispenseDbRow[]).map(d => ({
            id: d.id,
            created_at: d.created_at,
            item_name: d.items?.name ?? null,
            quantity: d.quantity,
            patient_ref: d.patient_ref,
            month: d.month,
            day: d.day,
            year: d.year,
            by_name: d.profiles?.display_name ?? '—',
          }))
          setDispenses(prev => (fromHead ? rows : [...prev, ...rows]))
          setHasMore(h => ({ ...h, dispense: rows.length === PAGE_SIZE }))
        }
        if (fromHead) setLoading(false)
        else setLoadingMore(s => ({ ...s, dispense: false }))
      } else {
        if (!fromHead && (!hasMore.receipt || loadingMore.receipt)) return
        if (fromHead) setLoading(true)
        else setLoadingMore(s => ({ ...s, receipt: true }))
        const from = fromHead ? 0 : receipts.length
        const to = from + PAGE_SIZE - 1
        const { data, error } = await supabase
          .from('stock_receipts')
          .select('*, items(name), profiles(display_name)')
          .order('created_at', { ascending: false })
          .range(from, to)
        if (error) {
          toast.error('Failed to load history', { description: error.message })
        } else if (data) {
          const rows: ReceiptRow[] = (data as unknown as ReceiptDbRow[]).map(r => ({
            id: r.id,
            created_at: r.created_at,
            item_name: r.items?.name ?? null,
            quantity: r.quantity,
            source: r.source,
            by_name: r.profiles?.display_name ?? '—',
          }))
          setReceipts(prev => (fromHead ? rows : [...prev, ...rows]))
          setHasMore(h => ({ ...h, receipt: rows.length === PAGE_SIZE }))
        }
        if (fromHead) setLoading(false)
        else setLoadingMore(s => ({ ...s, receipt: false }))
      }
    },
    [supabase, dispenses.length, receipts.length, hasMore, loadingMore],
  )

  useEffect(() => {
    if (profileLoading) return
    if (!profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    // `load` is intentionally omitted — re-fetching on every render would
    // cause request spam. We re-fetch when tab/profile change instead.
    void load(tab, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, profile?.id, profileLoading])

  const rows = tab === 'dispense' ? dispenses : receipts
  const hasMoreCurrent = tab === 'dispense' ? hasMore.dispense : hasMore.receipt
  const loadingMoreCurrent = tab === 'dispense' ? loadingMore.dispense : loadingMore.receipt

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transaction history"
        description="Complete audit trail of every dispense and stock receipt."
      />

      <div role="tablist" aria-label="History type" className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1">
        <TabButton
          active={tab === 'dispense'}
          onClick={() => setTab('dispense')}
          icon={<PackageOpen className="h-3.5 w-3.5" />}
        >
          Dispenses ({dispenses.length})
        </TabButton>
        <TabButton
          active={tab === 'receipt'}
          onClick={() => setTab('receipt')}
          icon={<PackagePlus className="h-3.5 w-3.5" />}
        >
          Receipts ({receipts.length})
        </TabButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" label="Loading history…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'dispense' ? 'No dispenses recorded' : 'No stock receipts recorded'}
          description={
            tab === 'dispense'
              ? 'When staff dispense medicine, the transactions will appear here.'
              : 'When stock arrives, the receipts will appear here.'
          }
        />
      ) : tab === 'dispense' ? (
        <DispensesTable rows={dispenses} />
      ) : (
        <ReceiptsTable rows={receipts} />
      )}

      {hasMoreCurrent && !loading && rows.length > 0 && (
        <div className="flex justify-center pt-2">
          <SecondaryButton
            onClick={() => load(tab, false)}
            disabled={loadingMoreCurrent}
          >
            {loadingMoreCurrent ? 'Loading…' : 'Load more'}
          </SecondaryButton>
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
        active
          ? 'bg-white text-ink-900 shadow-sm'
          : 'text-ink-500 hover:text-ink-700',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function DispensesTable({ rows }: { rows: DispenseRow[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-200 bg-ink-50/60 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Medicine</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Day</th>
            <th className="px-4 py-3">Staff</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map(d => (
            <tr key={d.id} className="transition hover:bg-ink-50/60">
              <td className="px-4 py-3 text-xs text-ink-500">
                {format(new Date(d.created_at), 'MMM d, yyyy · HH:mm')}
              </td>
              <td className="px-4 py-3 font-medium text-ink-900">
                {d.item_name ?? `Item #${d.id}`}
              </td>
              <td className="px-4 py-3 text-right">
                <StatusPill variant="critical" label={`−${d.quantity}`} />
              </td>
              <td className="px-4 py-3 text-ink-600">{d.patient_ref || '—'}</td>
              <td className="px-4 py-3 text-ink-500 tabular-nums">
                {String(d.year)}-{String(d.month).padStart(2, '0')}-
                {String(d.day).padStart(2, '0')}
              </td>
              <td className="px-4 py-3 text-ink-600">{d.by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReceiptsTable({ rows }: { rows: ReceiptRow[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-200 bg-ink-50/60 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Medicine</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Staff</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map(r => (
            <tr key={r.id} className="transition hover:bg-ink-50/60">
              <td className="px-4 py-3 text-xs text-ink-500">
                {format(new Date(r.created_at), 'MMM d, yyyy · HH:mm')}
              </td>
              <td className="px-4 py-3 font-medium text-ink-900">
                {r.item_name ?? `Item #${r.id}`}
              </td>
              <td className="px-4 py-3 text-right">
                <StatusPill variant="ok" label={`+${r.quantity}`} />
              </td>
              <td className="px-4 py-3 text-ink-600">{r.source}</td>
              <td className="px-4 py-3 text-ink-600">{r.by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
