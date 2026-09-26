import { z } from 'zod'
import { CATEGORIES } from './categories'
import { MAX_PAYOUT_CENTS, MIN_PAYOUT_CENTS } from './money'

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]]

export function todayInSA(now = new Date()): string {
  // YYYY-MM-DD in Africa/Johannesburg (UTC+2, no DST).
  return new Date(now.getTime() + 2 * 3600_000).toISOString().slice(0, 10)
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const signupSchema = z.object({
  display_name: z.string().trim().min(2, 'Please enter your name.').max(60, 'Please keep your name under 60 characters.'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(72, 'Please use 72 characters or fewer.'),
  role: z.enum(['worker', 'customer'], { message: 'Choose what you want to do first.' }),
  area_slug: z.string().min(1, 'Choose your area.'),
})
export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
})

export const profileSchema = z.object({
  display_name: z.string().trim().min(2, 'Please enter your name.').max(60),
  role: z.enum(['worker', 'customer']),
  area_slug: z.string().min(1, 'Choose your area.'),
  headline: z.string().trim().max(80, 'Keep your headline under 80 characters.').optional().or(z.literal('')),
  bio: z.string().trim().max(500, 'Keep your bio under 500 characters.').optional().or(z.literal('')),
  skills: z.array(z.enum(categorySlugs)).max(12),
})

// South African mobile/landline numbers: 0XXXXXXXXX or +27XXXXXXXXX.
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(\+27|0)[1-8]\d{8}$/.test(v), 'Enter a South African number, e.g. 071 234 5678.')

export function gigSchema(today = todayInSA()) {
  return z.object({
    title: z.string().trim().min(5, 'Give your gig a short title (at least 5 characters).').max(80, 'Keep the title under 80 characters.'),
    category: z.enum(categorySlugs, { message: 'Choose a category.' }),
    description: z
      .string()
      .trim()
      .min(20, 'Describe the work in at least 20 characters so workers know what to expect.')
      .max(1000, 'Keep the description under 1000 characters.'),
    area_slug: z.string().min(1, 'Choose the area where the work happens.'),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.')
      .refine((d) => d >= today, 'Choose today or a future date.')
      .refine((d) => d <= addDays(today, 180), 'Choose a date within the next 6 months.'),
    time_window: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
    payout_cents: z
      .number({ message: 'Enter what the worker will earn.' })
      .int()
      .min(MIN_PAYOUT_CENTS, 'The minimum payout is R50.')
      .max(MAX_PAYOUT_CENTS, 'The maximum payout is R50 000.'),
    address: z.string().trim().max(200, 'Keep the address under 200 characters.').optional().or(z.literal('')),
    access_notes: z.string().trim().max(300, 'Keep notes under 300 characters.').optional().or(z.literal('')),
  })
}
export type GigInput = z.infer<ReturnType<typeof gigSchema>>

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Choose a star rating.').max(5),
  comment: z.string().trim().max(500, 'Keep your review under 500 characters.').optional().or(z.literal('')),
})

export const EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024

export function validateEvidenceFile(file: { type: string; size: number }): string | null {
  if (!(EVIDENCE_TYPES as readonly string[]).includes(file.type)) return 'Please choose a JPEG, PNG or WebP photo.'
  if (file.size > EVIDENCE_MAX_BYTES) return 'Photos must be 5 MB or smaller.'
  if (file.size === 0) return 'That file is empty.'
  return null
}

export function firstError(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
