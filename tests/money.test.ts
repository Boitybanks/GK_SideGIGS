import { describe, expect, it } from 'vitest'
import { breakdown, feeCents, formatRand, randsToCents } from '../src/lib/money'

describe('SideGigs fee (15% added to the customer)', () => {
  it('matches the brief: R500 payout → R75 fee → R575 total, worker earns R500', () => {
    expect(breakdown(50_000)).toEqual({ payout: 50_000, fee: 7_500, total: 57_500 })
  })
  it('rounds half-up to the cent exactly like the database generated column', () => {
    expect(feeCents(33_300)).toBe(4_995) // R333 → R49.95
    expect(feeCents(10)).toBe(2) // 1.5c → 2c
    expect(feeCents(5_000)).toBe(750)
  })
  it('never takes anything from the worker payout', () => {
    for (const p of [5_000, 12_345, 99_999, 5_000_000]) expect(breakdown(p).payout).toBe(p)
  })
  it('formats rands for South African readers', () => {
    expect(formatRand(50_000)).toBe('R500')
    expect(formatRand(150_000)).toBe('R1 500')
    expect(formatRand(4_995)).toBe('R49.95')
    expect(formatRand(1_480_000)).toBe('R14 800')
    expect(randsToCents(500)).toBe(50_000)
  })
})
