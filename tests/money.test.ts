import { describe, expect, it } from 'vitest'
import { breakdown, feeCents, formatRand, randsToCents, workerNetCents } from '../src/lib/money'

describe('SideGigs admin fee (15% from the worker’s pay)', () => {
  it('R500 job → customer pays R500, R75 admin fee, worker receives R425', () => {
    expect(breakdown(50_000)).toEqual({ price: 50_000, fee: 7_500, workerNet: 42_500 })
    expect(workerNetCents(50_000)).toBe(42_500)
  })
  it('rounds the fee half-up to the cent, like the database column', () => {
    expect(feeCents(333)).toBe(50) // 49.95 → 50
    expect(feeCents(5_000)).toBe(750)
    expect(workerNetCents(333)).toBe(283)
  })
  it('formats rands for South African readers', () => {
    expect(formatRand(42_500)).toBe('R425')
    expect(formatRand(115_000)).toBe('R1 150')
    expect(formatRand(4_995)).toBe('R49.95')
    expect(randsToCents(12.5)).toBe(1_250)
  })
})
