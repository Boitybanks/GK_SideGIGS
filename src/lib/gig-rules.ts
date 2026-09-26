// UI mirror of the lifecycle enforced by the database RPCs (supabase/migrations/*_rpc_functions.sql).
import type { Gig, GigStatus } from './types'

export const STATUS_LABEL: Record<GigStatus, string> = {
  open: 'Open',
  matched: 'Worker chosen',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const LIFECYCLE: GigStatus[] = ['open', 'matched', 'in_progress', 'completed']

export type Viewer = 'customer' | 'assigned_worker' | 'other_worker' | 'guest'

export function viewerOf(gig: Pick<Gig, 'customer_id' | 'assigned_worker_id'>, userId: string | null | undefined): Viewer {
  if (!userId) return 'guest'
  if (gig.customer_id === userId) return 'customer'
  if (gig.assigned_worker_id === userId) return 'assigned_worker'
  return 'other_worker'
}

export type GigAction =
  | 'apply'
  | 'withdraw'
  | 'select_worker'
  | 'start'
  | 'mark_done'
  | 'confirm_completion'
  | 'review'
  | 'cancel'
  | 'reveal_contact'

interface Context {
  hasApplied?: boolean
  applicationPending?: boolean
  hasReview?: boolean
}

export function allowedActions(
  gig: Pick<Gig, 'status' | 'worker_done_at' | 'customer_id' | 'assigned_worker_id'>,
  viewer: Viewer,
  ctx: Context = {},
): GigAction[] {
  const actions: GigAction[] = []
  switch (viewer) {
    case 'customer':
      if (gig.status === 'open') actions.push('select_worker', 'cancel')
      if (gig.status === 'matched') actions.push('confirm_completion', 'cancel', 'reveal_contact')
      if (gig.status === 'in_progress') actions.push('confirm_completion', 'reveal_contact')
      if (gig.status === 'completed') {
        actions.push('reveal_contact')
        if (!ctx.hasReview) actions.push('review')
      }
      break
    case 'assigned_worker':
      if (gig.status === 'matched') actions.push('start', 'reveal_contact')
      if (gig.status === 'in_progress') {
        if (!gig.worker_done_at) actions.push('mark_done')
        actions.push('reveal_contact')
      }
      if (gig.status === 'completed') actions.push('reveal_contact')
      break
    case 'other_worker':
      if (gig.status === 'open') {
        if (ctx.applicationPending) actions.push('withdraw')
        else if (!ctx.hasApplied) actions.push('apply')
      }
      break
    case 'guest':
      if (gig.status === 'open') actions.push('apply')
      break
  }
  return actions
}

/** Plain-language next step, shown at the top of the gig page. */
export function nextStepText(gig: Pick<Gig, 'status' | 'worker_done_at'>, viewer: Viewer): string {
  if (gig.status === 'cancelled') return 'This gig was cancelled.'
  if (gig.status === 'completed') return viewer === 'assigned_worker'
    ? 'Done! This job is now a verified record on your portfolio.'
    : 'This gig is complete.'
  if (viewer === 'customer') {
    if (gig.status === 'open') return 'Review the people who applied and choose one.'
    if (gig.status === 'matched') return 'Your worker is confirmed. Confirm completion once the work is done.'
    return gig.worker_done_at
      ? 'Your worker says the job is done. Check it and confirm completion.'
      : 'Work is in progress. Confirm completion once you are happy.'
  }
  if (viewer === 'assigned_worker') {
    if (gig.status === 'matched') return 'You got the job! Tap “Start job” when you begin.'
    return gig.worker_done_at
      ? 'Waiting for the customer to confirm completion.'
      : 'Tap “Mark as done” when you finish so the customer can confirm.'
  }
  if (gig.status === 'open') return 'Apply to let the customer know you can do this.'
  return 'This gig has been filled.'
}

export const TIME_WINDOW_LABEL = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  flexible: 'Flexible time',
} as const
