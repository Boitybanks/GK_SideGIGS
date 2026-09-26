import { ShieldCheck } from 'lucide-react'
import { formatRand } from '../../lib/money'
import type { Transaction } from '../../lib/types'
import { Badge } from '../ui'

const statusCopy = {
  held: { tone: 'blue' as const, label: 'Held by SideGigs' },
  released: { tone: 'brand' as const, label: 'Released to worker' },
  refunded: { tone: 'gray' as const, label: 'Refunded' },
}

export function PaymentPanel({ txn, perspective }: { txn: Transaction; perspective: 'customer' | 'worker' }) {
  const s = statusCopy[txn.status]
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold">
          <ShieldCheck className="size-5 text-brand-600" aria-hidden /> SideGigs protection
        </p>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      {perspective === 'customer' ? (
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Worker earns</dt><dd className="font-semibold">{formatRand(txn.payout_cents)}</dd></div>
          <div className="flex justify-between"><dt>Protection fee</dt><dd className="font-semibold">{formatRand(txn.fee_cents)}</dd></div>
          <div className="flex justify-between border-t border-line pt-1"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatRand(txn.total_cents)}</dd></div>
        </dl>
      ) : (
        <p className="mt-3 text-sm">
          You earn <strong className="text-brand-700">{formatRand(txn.payout_cents)}</strong>
          {txn.status === 'held' && ' — paid out when the customer confirms the job is done.'}
          {txn.status === 'released' && ' — released.'}
          {txn.status === 'refunded' && ' — the gig was cancelled.'}
        </p>
      )}
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-sun-700">Simulation — no real money moves in this version</p>
    </div>
  )
}
