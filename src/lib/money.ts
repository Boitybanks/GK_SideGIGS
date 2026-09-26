// Money is always integer cents. The database is the source of truth for pricing (generated columns);
// this mirror exists so the UI can show each side its own number live while someone types.
// The client pays the job price, nothing added. SideGigs' 8% fee comes out of the service provider's pay and is the
// only deduction: no VAT is withheld from providers, who are independent and mostly not VAT-registered (R500 → R460).
// Whoever posts types their own number: a client posting a gig enters what they pay; a provider listing a service
// enters what they take home, and the client is shown the price that pays exactly that.

export const FEE_RATE_PERCENT = 8
export const MIN_PAYOUT_CENTS = 5_000 // R50 job price
export const MAX_PAYOUT_CENTS = 5_000_000 // R50 000 job price
export const MIN_TAKE_HOME_CENTS = 4_600 // R46 take-home = R50 price
export const MAX_TAKE_HOME_CENTS = 4_600_000 // R46 000 take-home = R50 000 price

/** Same as private.sidegigs_fee_cents: 8% of the price, rounded half-up to the cent. */
export function feeCents(priceCents: number): number {
  return Math.floor((priceCents * FEE_RATE_PERCENT + 50) / 100)
}

/** Same as public.gigs.worker_net_cents: what the provider receives after the fee. */
export function workerNetCents(priceCents: number): number {
  return priceCents - feeCents(priceCents)
}

/** Same as private.price_for_take_home: the smallest price that pays the provider exactly `takeHomeCents`. */
export function priceForTakeHome(takeHomeCents: number): number {
  const guess = Math.floor((takeHomeCents * 100) / (100 - FEE_RATE_PERCENT))
  for (let p = Math.max(guess - 3, 0); p <= guess + 3; p++) if (workerNetCents(p) >= takeHomeCents) return p
  throw new Error(`No price pays ${takeHomeCents} cents`)
}

/** price = what the client pays; fee = SideGigs' fee from the provider's pay; workerNet = what the provider receives. */
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
