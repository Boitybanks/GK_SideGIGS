import { breakdown, formatRand, FEE_RATE_PERCENT, VAT_RATE_PERCENT } from '../../lib/money'

/**
 * Each side sees its own number. Client: what you pay, with VAT and the SideGigs fee inside it.
 * Provider: what you receive after VAT and the fee. `counterpart` (used while posting) previews what the other side sees.
 */
export function FeeBreakdown({ payoutCents, perspective, counterpart = false }: {
  payoutCents: number
  perspective: 'customer' | 'worker'
  counterpart?: boolean
}) {
  const b = breakdown(payoutCents)
  if (perspective === 'worker') {
    return (
      <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-inset ring-brand-100">
        <p className="text-sm font-semibold text-brand-800">You receive</p>
        <p className="text-3xl font-extrabold text-brand-800">{formatRand(b.workerNet)}</p>
        <p className="mt-1 text-xs text-brand-800/80">
          After {VAT_RATE_PERCENT}% VAT ({formatRand(b.vat)}) and SideGigs’ {FEE_RATE_PERCENT}% fee ({formatRand(b.fee)}).
        </p>
        {counterpart && (
          <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-brand-100 pt-3 text-sm text-brand-800">
            <span>Clients see <span className="text-xs text-brand-800/80">(incl. VAT and the SideGigs fee)</span></span>
            <strong className="shrink-0">{formatRand(b.price)}</strong>
          </p>
        )}
      </div>
    )
  }
  return (
    <dl className="space-y-1.5 rounded-xl bg-canvas p-4 text-sm ring-1 ring-inset ring-line" aria-label="Price breakdown">
      <div className="flex justify-between text-base">
        <dt className="font-bold">You pay</dt>
        <dd className="font-extrabold">{formatRand(b.price)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>Includes VAT ({VAT_RATE_PERCENT}%)</dt>
        <dd>{formatRand(b.vat)}</dd>
      </div>
      <div className="flex justify-between text-muted">
        <dt>Includes SideGigs fee ({FEE_RATE_PERCENT}%)</dt>
        <dd>{formatRand(b.fee)}</dd>
      </div>
      {counterpart && (
        <div className="flex justify-between gap-3 border-t border-line pt-2">
          <dt>Service providers see <span className="text-xs text-muted">(after VAT and the fee)</span></dt>
          <dd className="shrink-0 font-semibold">{formatRand(b.workerNet)}</dd>
        </div>
      )}
    </dl>
  )
}
