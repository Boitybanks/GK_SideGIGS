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
  workerNetCents,
} from '../src/lib/money'

describe('pricing: 8% SideGigs fee from the provider’s pay, no VAT withheld', () => {
  it('R500 job → client pays R500, fee R40, provider receives R460', () => {
    expect(breakdown(50_000)).toEqual({ price: 50_000, fee: 4_000, workerNet: 46_000 })
    expect(workerNetCents(50_000)).toBe(46_000)
  })
  it('rounds the fee half-up to the cent, like the database column', () => {
    expect(feeCents(333)).toBe(27) // 26.64 → 27
    expect(feeCents(20_006)).toBe(1_600) // 1600.48 → 1600
    expect(workerNetCents(333)).toBe(306)
  })
  it('a provider’s take-home maps to the smallest client price that pays exactly that', () => {
    expect(priceForTakeHome(46_000)).toBe(50_000)
    expect(priceForTakeHome(40_000)).toBe(43_478)
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
