import { breakdown, formatRand, FEE_RATE_PERCENT } from '../../lib/money'

/** Customer view: you pay the job price; the admin fee comes out of the worker's share. Worker view: what you receive. */
export function FeeBreakdown({ payoutCents, perspective }: { payoutCents: number; perspective: 'customer' | 'worker' }) {
  const b = breakdown(payoutCents)
  if (perspective === 'worker') {
    return (
      <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-100">
        <p className="text-sm font-semibold text-brand-800">You receive</p>
        <p className="text-3xl font-extrabold text-brand-800">{formatRand(b.workerNet)}</p>
        <p className="mt-1 text-xs text-brand-800/80">
          The job pays {formatRand(b.price)}. SideGigs’ {FEE_RATE_PERCENT}% admin fee ({formatRand(b.fee)}) comes out of that.
        </p>
      </div>
    )
  }
  return (
    <dl className="space-y-1.5 rounded-xl bg-canvas p-4 text-sm ring-1 ring-inset ring-line" aria-label="Price breakdown">
      <div className="flex justify-between text-base">
        <dt className="font-bold">You pay</dt>
        <dd className="font-extrabold">{formatRand(b.price)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>SideGigs admin fee ({FEE_RATE_PERCENT}%, from the worker’s pay)</dt>
        <dd className="font-semibold">{formatRand(b.fee)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2">
        <dt>Worker receives</dt>
        <dd className="font-semibold">{formatRand(b.workerNet)}</dd>
      </div>
    </dl>
  )
}
