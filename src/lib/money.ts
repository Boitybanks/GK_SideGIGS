// Money is always integer cents. The database is the source of truth for fees (generated columns);
// this mirror exists so the UI can show the breakdown live while the customer types.
// The customer pays the agreed job price; SideGigs' 15% admin fee comes out of the worker's pay.

export const FEE_RATE_PERCENT = 15
export const MIN_PAYOUT_CENTS = 5_000 // R50
export const MAX_PAYOUT_CENTS = 5_000_000 // R50 000

/** Same formula as public.gigs.fee_cents: round half-up to the cent. */
export function feeCents(priceCents: number): number {
  return Math.floor((priceCents * FEE_RATE_PERCENT + 50) / 100)
}

/** Same as public.gigs.worker_net_cents: what the worker receives after the admin fee. */
export function workerNetCents(priceCents: number): number {
  return priceCents - feeCents(priceCents)
}

/** price = what the customer pays; fee = admin fee from the worker's pay; workerNet = what the worker receives. */
export function breakdown(priceCents: number) {
  const fee = feeCents(priceCents)
  return { price: priceCents, fee, workerNet: priceCents - fee }
}

export function randsToCents(rands: number): number {
  return Math.round(rands * 100)
}

/** "R500", "R1 500", "R49.95" — space thousands separator, point decimal, locale-independent. */
export function formatRand(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(Math.round(cents))
  const rands = Math.floor(abs / 100)
  const rem = abs % 100
  const grouped = String(rands).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${negative ? '-' : ''}R${grouped}${rem ? `.${String(rem).padStart(2, '0')}` : ''}`
}
