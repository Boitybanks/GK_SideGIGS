// Money is always integer cents. The database is the source of truth for fees (generated columns);
// this mirror exists so the UI can show the breakdown live while the customer types.

export const FEE_RATE_PERCENT = 15
export const MIN_PAYOUT_CENTS = 5_000 // R50
export const MAX_PAYOUT_CENTS = 5_000_000 // R50 000

/** Same formula as public.gigs.fee_cents: round half-up to the cent. */
export function feeCents(payoutCents: number): number {
  return Math.floor((payoutCents * FEE_RATE_PERCENT + 50) / 100)
}

export function breakdown(payoutCents: number) {
  const fee = feeCents(payoutCents)
  return { payout: payoutCents, fee, total: payoutCents + fee }
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
