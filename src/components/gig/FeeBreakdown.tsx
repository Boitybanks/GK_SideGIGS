import { breakdown, formatRand, FEE_RATE_PERCENT } from '../../lib/money'

/** Customer view: payout + protection fee = total. Worker view: "You earn R500". */
export function FeeBreakdown({ payoutCents, perspective }: { payoutCents: number; perspective: 'customer' | 'worker' }) {
  const b = breakdown(payoutCents)
  if (perspective === 'worker') {
    return (
      <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-100">
        <p className="text-sm font-semibold text-brand-800">You earn</p>
        <p className="text-3xl font-extrabold text-brand-800">{formatRand(b.payout)}</p>
        <p className="mt-1 text-xs text-brand-800/80">The full amount. SideGigs never takes a cut from workers.</p>
      </div>
    )
  }
  return (
    <dl className="space-y-1.5 rounded-xl bg-canvas p-4 text-sm ring-1 ring-inset ring-line" aria-label="Price breakdown">
      <div className="flex justify-between">
        <dt>Gig (worker earns)</dt>
        <dd className="font-semibold">{formatRand(b.payout)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>SideGigs protection fee ({FEE_RATE_PERCENT}%)</dt>
        <dd className="font-semibold">{formatRand(b.fee)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base">
        <dt className="font-bold">You pay in total</dt>
        <dd className="font-extrabold">{formatRand(b.total)}</dd>
      </div>
    </dl>
  )
}
