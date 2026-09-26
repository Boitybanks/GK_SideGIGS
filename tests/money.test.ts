import { describe, expect, it } from 'vitest'
import {
  breakdown,
  feeCents,
  formatRand,
  MAX_PAYOUT_CENTS,
  MAX_TAKE_HOME_CENTS,
  MIN_PAYOUT_CENTS,
  MIN_TAKE_HOME_CENTS,
  priceForTakeHome,
  randsToCents,
  vatCents,
  workerNetCents,
} from '../src/lib/money'

describe('pricing: VAT-inclusive price, 8% SideGigs fee on the ex-VAT amount', () => {
  it('R500 job → client pays R500, VAT R65.22, fee R34.78, provider receives R400', () => {
    expect(breakdown(50_000)).toEqual({ price: 50_000, vat: 6_522, fee: 3_478, workerNet: 40_000 })
    expect(workerNetCents(50_000)).toBe(40_000)
  })
  it('rounds VAT and the fee half-up to the cent, like the database columns', () => {
    expect(vatCents(20_000)).toBe(2_609) // 26.087 → 26.09
    expect(feeCents(20_000)).toBe(1_391) // 8% of 173.91 = 13.913 → 13.91
    expect(workerNetCents(20_000)).toBe(16_000)
    expect(vatCents(333)).toBe(43) // 43.43 → 43
    expect(workerNetCents(333)).toBe(267)
  })
  it('a provider’s take-home maps to the smallest client price that pays exactly that', () => {
    expect(priceForTakeHome(40_000)).toBe(50_000)
    expect(priceForTakeHome(28_000)).toBe(35_000)
    expect(priceForTakeHome(MIN_TAKE_HOME_CENTS)).toBe(MIN_PAYOUT_CENTS)
    expect(priceForTakeHome(MAX_TAKE_HOME_CENTS)).toBe(MAX_PAYOUT_CENTS)
    for (let n = MIN_TAKE_HOME_CENTS; n < MIN_TAKE_HOME_CENTS + 20_000; n++) {
      const p = priceForTakeHome(n)
      expect(workerNetCents(p)).toBe(n)
      expect(workerNetCents(p - 1)).toBeLessThan(n)
    }
  })
  it('formats rands for South African readers', () => {
    expect(formatRand(42_500)).toBe('R425')
    expect(formatRand(115_000)).toBe('R1 150')
    expect(formatRand(4_995)).toBe('R49.95')
    expect(randsToCents(12.5)).toBe(1_250)
  })
})
