// All data access in one place. Trust-bearing writes go through RPCs; reads rely on RLS.
import { supabase, EVIDENCE_BUCKET } from './supabase'
import { gigAad, phoneAad } from './pq/aad'
import type { SignedCredential } from './pq/credential'
import type {
  Application,
  Area,
  DiscoverGig,
  DiscoverWorker,
  Gig,
  GigEvent,
  ImpactMetrics,
  PortfolioItem,
  Profile,
  RevealedContact,
  Review,
  Transaction,
  WorkerStats,
} from './types'
import type { GigInput } from './validation'
import { validateEvidenceFile } from './validation'

const PUBLIC_PROFILE = 'id, display_name, role, area_slug, headline, bio, skills, is_demo, created_at'

/** Post-quantum encrypt in the browser. Crypto code is loaded on demand to keep first load light. */
async function encryptForVault(plaintext: unknown, aad: string) {
  const [{ encryptEnvelope }, { fromBase64 }, keys] = await Promise.all([
    import('./pq/envelope'),
    import('./pq/bytes'),
    import('./pq-public-keys'),
  ])
  return encryptEnvelope(plaintext, aad, { publicKey: fromBase64(keys.KEM_PUBLIC_KEY_B64), kid: keys.KEM_KID })
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

function must<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw result.error
  return result.data as T
}

// ── Reference data ─────────────────────────────────────────────────────────
export async function fetchAreas(): Promise<Area[]> {
  return must(await supabase.from('areas').select('*').order('province').order('city').order('name'))
}

// ── Discovery ──────────────────────────────────────────────────────────────
export const PAGE_SIZE = 12

export async function discoverGigs(params: {
  area?: string | null
  category?: string | null
  skills?: string[] | null
  page: number
}): Promise<DiscoverGig[]> {
  return rpc<DiscoverGig[]>('discover_gigs', {
    p_area: params.area ?? null,
    p_category: params.category ?? null,
    p_skills: params.skills?.length ? params.skills : null,
    p_limit: PAGE_SIZE,
    p_offset: params.page * PAGE_SIZE,
  })
}

export async function discoverWorkers(params: { area?: string | null; skill?: string | null; page: number }): Promise<DiscoverWorker[]> {
  return rpc<DiscoverWorker[]>('discover_workers', {
    p_area: params.area ?? null,
    p_skill: params.skill ?? null,
    p_limit: PAGE_SIZE,
    p_offset: params.page * PAGE_SIZE,
  })
}

// ── Profiles & portfolio ───────────────────────────────────────────────────
export async function fetchProfile(id: string): Promise<Profile | null> {
  return must(await supabase.from('profiles').select(PUBLIC_PROFILE).eq('id', id).maybeSingle())
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'display_name' | 'role' | 'area_slug' | 'headline' | 'bio' | 'skills'>>) {
  must(await supabase.from('profiles').update(patch).eq('id', id).select('id').single())
}

export async function createProfile(p: Pick<Profile, 'id' | 'display_name' | 'role' | 'area_slug' | 'headline' | 'bio' | 'skills'>) {
  must(await supabase.from('profiles').insert(p).select('id').single())
}

export async function fetchWorkerStats(id: string): Promise<WorkerStats> {
  return rpc<WorkerStats>('worker_stats', { p_worker: id })
}

export async function fetchPortfolio(workerId: string): Promise<PortfolioItem[]> {
  return must(
    await supabase.from('portfolio_items').select('*').eq('worker_id', workerId).order('completed_at', { ascending: false }),
  )
}

export async function hasSavedPhone(userId: string): Promise<boolean> {
  const row = must(await supabase.from('profile_private').select('id').eq('id', userId).maybeSingle())
  return Boolean(row)
}

/** Phone numbers are post-quantum encrypted in the browser; the database only ever sees ciphertext. */
export async function savePhone(userId: string, phone: string) {
  const envelope = await encryptForVault({ phone }, phoneAad(userId))
  must(await supabase.from('profile_private').upsert({ id: userId, phone_envelope: envelope }).select('id').single())
}

export async function removePhone(userId: string) {
  must(await supabase.from('profile_private').delete().eq('id', userId))
}

// ── Gigs ───────────────────────────────────────────────────────────────────
export type GigWithPeople = Gig & {
  customer: Pick<Profile, 'id' | 'display_name' | 'area_slug' | 'is_demo' | 'headline'> | null
  worker: Pick<Profile, 'id' | 'display_name' | 'area_slug' | 'is_demo' | 'headline'> | null
}

export async function fetchGig(id: string): Promise<GigWithPeople | null> {
  return must(
    await supabase
      .from('gigs')
      .select(
        '*, customer:profiles!gigs_customer_id_fkey(id, display_name, area_slug, is_demo, headline), worker:profiles!gigs_assigned_worker_id_fkey(id, display_name, area_slug, is_demo, headline)',
      )
      .eq('id', id)
      .maybeSingle(),
  )
}

export async function createGig(input: GigInput): Promise<string> {
  const id = crypto.randomUUID()
  const address = input.address?.trim()
  const notes = input.access_notes?.trim()
  const envelope =
    address || notes
      ? await encryptForVault({ address: address || null, access_notes: notes || null }, gigAad(id))
      : null
  return rpc<string>('create_gig', {
    p_id: id,
    p_title: input.title,
    p_category: input.category,
    p_description: input.description,
    p_area: input.area_slug,
    p_date: input.scheduled_date,
    p_time_window: input.time_window,
    p_payout_cents: input.payout_cents,
    p_envelope: envelope,
  })
}

export type ApplicationWithWorker = Application & {
  worker: Pick<Profile, 'id' | 'display_name' | 'headline' | 'skills' | 'area_slug' | 'is_demo'> | null
}

export async function fetchApplications(gigId: string): Promise<ApplicationWithWorker[]> {
  return must(
    await supabase
      .from('gig_applications')
      .select('*, worker:profiles(id, display_name, headline, skills, area_slug, is_demo)')
      .eq('gig_id', gigId)
      .order('created_at'),
  )
}

export async function fetchMyApplication(gigId: string, userId: string): Promise<Application | null> {
  return must(
    await supabase.from('gig_applications').select('*').eq('gig_id', gigId).eq('worker_id', userId).maybeSingle(),
  )
}

export async function fetchEvents(gigId: string): Promise<GigEvent[]> {
  return must(await supabase.from('gig_events').select('*').eq('gig_id', gigId).order('created_at').order('id'))
}

export async function fetchTransaction(gigId: string): Promise<Transaction | null> {
  return must(await supabase.from('transactions').select('*').eq('gig_id', gigId).maybeSingle())
}

export async function fetchReview(gigId: string): Promise<Review | null> {
  return must(await supabase.from('reviews').select('*').eq('gig_id', gigId).maybeSingle())
}

export async function fetchPortfolioItemForGig(gigId: string): Promise<PortfolioItem | null> {
  return must(await supabase.from('portfolio_items').select('*').eq('gig_id', gigId).maybeSingle())
}

export async function fetchPostedGigs(userId: string): Promise<(Gig & { applicant_count: number })[]> {
  const gigs = must(
    await supabase
      .from('gigs')
      .select('*, gig_applications(status)')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false }),
  ) as (Gig & { gig_applications: { status: string }[] })[]
  return gigs.map(({ gig_applications, ...g }) => ({
    ...g,
    applicant_count: gig_applications.filter((a) => a.status === 'pending').length,
  }))
}

export async function fetchAssignedGigs(userId: string): Promise<Gig[]> {
  return must(
    await supabase.from('gigs').select('*').eq('assigned_worker_id', userId).order('scheduled_date', { ascending: false }),
  )
}

export type ApplicationWithGig = Application & { gig: Gig | null }

export async function fetchMyApplications(userId: string): Promise<ApplicationWithGig[]> {
  return must(
    await supabase
      .from('gig_applications')
      .select('*, gig:gigs(*)')
      .eq('worker_id', userId)
      .in('status', ['pending', 'declined', 'withdrawn'])
      .order('created_at', { ascending: false }),
  )
}

// ── Lifecycle (RPCs enforce roles and states) ─────────────────────────────
export const applyToGig = (gigId: string, message: string) => rpc<string>('apply_to_gig', { p_gig: gigId, p_message: message })
export const withdrawApplication = (gigId: string) => rpc<void>('withdraw_application', { p_gig: gigId })
export const selectWorker = (gigId: string, applicationId: string) =>
  rpc<void>('select_worker', { p_gig: gigId, p_application: applicationId })
export const startGig = (gigId: string) => rpc<void>('start_gig', { p_gig: gigId })
export const markGigDone = (gigId: string) => rpc<void>('mark_gig_done', { p_gig: gigId })
export const confirmCompletion = (gigId: string) => rpc<string>('confirm_completion', { p_gig: gigId })
export const submitReview = (gigId: string, rating: number, comment: string) =>
  rpc<void>('submit_review', { p_gig: gigId, p_rating: rating, p_comment: comment })
export const cancelGig = (gigId: string) => rpc<void>('cancel_gig', { p_gig: gigId })
export const reportContent = (params: { gigId?: string; userId?: string; reason: string; details: string }) =>
  rpc<string>('report_content', {
    p_gig: params.gigId ?? null,
    p_user: params.userId ?? null,
    p_reason: params.reason,
    p_details: params.details,
  })

// ── Metrics ────────────────────────────────────────────────────────────────
export const fetchImpact = (includeDemo: boolean) => rpc<ImpactMetrics>('impact_metrics', { p_include_demo: includeDemo })

// ── Evidence photos ────────────────────────────────────────────────────────
export async function uploadEvidence(itemId: string, userId: string, file: File) {
  const problem = validateEvidenceFile(file)
  if (problem) throw new Error(problem)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${itemId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  await rpc<void>('add_portfolio_evidence', { p_item: itemId, p_path: path })
  return path
}

export async function removeEvidence(itemId: string, path: string) {
  await rpc<void>('remove_portfolio_evidence', { p_item: itemId, p_path: path })
  await supabase.storage.from(EVIDENCE_BUCKET).remove([path])
}

// ── Netlify Functions (post-quantum) ──────────────────────────────────────
async function callFunction<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as { error?: string }).error ?? 'The secure service is unavailable. Please try again.')
  return body as T
}

export async function revealContact(gigId: string): Promise<RevealedContact> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in again.')
  return callFunction<RevealedContact>('/api/reveal-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gigId }),
  })
}

export async function fetchWorkCredential(workerId: string): Promise<SignedCredential> {
  return callFunction<SignedCredential>(`/api/work-credential?worker=${encodeURIComponent(workerId)}`)
}
