import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Landmark, Store } from 'lucide-react'
import { fetchWallet, requestCashout } from '../lib/api'
import { useAuth } from '../lib/auth'
import { friendlyError } from '../lib/errors'
import { timeAgo } from '../lib/format'
import { CASH_VOUCHER_MAX_CENTS, CASHOUT_MIN_CENTS, cashoutFee, formatRand, randsToCents, type CashoutMethod } from '../lib/money'
import type { Cashout, WalletSummary } from '../lib/types'
import { Badge, Button, Card, ErrorState, Field, PageHeader, SimulationNote, Skeleton } from '../components/ui'
import { useToast } from '../components/ui/toast'

const BANKS = ['Capitec', 'FNB', 'Standard Bank', 'Absa', 'Nedbank', 'TymeBank', 'African Bank', 'Discovery Bank', 'Other bank']
const CASH_SHOPS = 'Boxer, Shoprite, Checkers, Usave, Pick n Pay, PEP, Spar and spaza shops with Flash, Kazang or OTT terminals'

function MethodOption({ method, current, onPick, title, body, fee, icon }: {
  method: CashoutMethod
  current: CashoutMethod
  onPick: (m: CashoutMethod) => void
  title: string
  body: string
  fee: string
  icon: ReactNode
}) {
  const on = method === current
  return (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${on ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-line bg-white hover:border-brand-200'}`}>
      <input type="radio" name="method" value={method} checked={on} onChange={() => onPick(method)} className="mt-1 size-4 accent-brand-600" />
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-line">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold">{title}</span>
          <span className="text-xs font-semibold text-brand-700">{fee}</span>
        </span>
        <span className="mt-0.5 block text-sm text-ink-soft">{body}</span>
      </span>
    </label>
  )
}

function CashoutRow({ c }: { c: Cashout }) {
  return (
    <li className="card flex items-center gap-3 p-4">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-brand-700">
        {c.method === 'cash' ? <Store className="size-5" /> : <Landmark className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{formatRand(c.amount_cents - c.fee_cents)} <span className="font-normal text-muted">· {c.destination}</span></span>
        <span className="block text-xs text-muted">
          {c.reference} · {timeAgo(c.created_at)} · {c.fee_cents ? `${formatRand(c.fee_cents)} fee` : 'free cash-out'}
        </span>
      </span>
      <Badge tone="brand">Paid (simulation)</Badge>
    </li>
  )
}

/** A provider's earnings from confirmed jobs, cashed out to a bank or as a cash voucher collected at a shop. */
export default function Wallet() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet })
  const [method, setMethod] = useState<CashoutMethod>('cash')
  const [amount, setAmount] = useState('')
  const [bank, setBank] = useState('')
  const [last4, setLast4] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Cashout | null>(null)

  if (q.isPending) return <div className="space-y-3"><Skeleton className="h-40" /><Skeleton className="h-72" /></div>
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const w: WalletSummary = q.data

  const cents = amount === '' ? 0 : randsToCents(Number(amount))
  const fee = cashoutFee(method, w.free_cashout_available)
  const cashLeftToday = Math.max(CASH_VOUCHER_MAX_CENTS - w.cash_today_cents, 0)
  const maxCents = method === 'cash' ? Math.min(w.available_cents, cashLeftToday) : w.available_cents
  const canCashOut = w.available_cents >= CASHOUT_MIN_CENTS
  const feeLabel = (m: CashoutMethod) => (w.free_cashout_available ? 'Free this week' : `${formatRand(cashoutFee(m, false))} fee`)

  function problem(): string {
    if (!cents || Number.isNaN(cents)) return 'Enter how much you want to cash out.'
    if (cents < CASHOUT_MIN_CENTS) return 'The minimum cash-out is R50.'
    if (cents > w.available_cents) return `You can cash out up to ${formatRand(w.available_cents)}.`
    if (method === 'cash' && cents > cashLeftToday) return `Cash vouchers are limited to R5 000 a day. You can still take ${formatRand(cashLeftToday)} in cash today.`
    if (method === 'bank' && !bank) return 'Choose your bank.'
    if (method === 'bank' && !/^\d{4}$/.test(last4)) return 'Enter the last 4 digits of your account number.'
    return ''
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const p = problem()
    setError(p)
    if (p) return
    setBusy(true)
    try {
      const result = await requestCashout({ method, amountCents: cents, bankName: bank, accountLast4: last4 })
      setDone(result)
      setAmount('')
      toast.show(`Cash-out sent: ${formatRand(result.amount_cents - result.fee_cents)} (simulation).`)
      await queryClient.invalidateQueries({ queryKey: ['wallet'] })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Wallet" subtitle="Money from confirmed jobs. Cash out to your bank, or collect cash at a shop with no bank account needed." />

      <Card className="overflow-hidden">
        <div className="bg-brand-600 p-5 text-white">
          <p className="text-sm font-semibold text-brand-100">Available to cash out</p>
          <p className="text-4xl font-extrabold">{formatRand(w.available_cents)}</p>
          <p className="mt-1 text-xs text-brand-100">
            {w.free_cashout_available ? 'Your first cash-out this week is free.' : 'You have used this week’s free cash-out; the next one costs R3 to a bank or R20 for cash.'}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-line">
          <div className="bg-white p-4">
            <dt className="text-xs text-muted">Waiting for clients to confirm</dt>
            <dd className="text-lg font-extrabold">{formatRand(w.held_cents)}</dd>
          </div>
          <div className="bg-white p-4">
            <dt className="text-xs text-muted">Earned on SideGigs</dt>
            <dd className="text-lg font-extrabold">{formatRand(w.earned_cents)}</dd>
          </div>
        </dl>
      </Card>

      {done && (
        <div role="status" className="mt-4 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
          <p className="flex items-center gap-2 font-bold text-brand-800"><CheckCircle2 className="size-5" aria-hidden /> {formatRand(done.amount_cents - done.fee_cents)} on its way · {done.reference}</p>
          <p className="mt-1 text-sm text-brand-800">
            {done.method === 'cash'
              ? `In the live version you get an SMS with a voucher number. Take it to ${CASH_SHOPS}, and enter your PIN at the till to collect your cash.`
              : `In the live version this is paid into your ${done.destination} account by our payment partner.`}
          </p>
        </div>
      )}

      {canCashOut ? (
        <form onSubmit={onSubmit} noValidate className="mt-4">
          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-bold">Cash out</h2>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-semibold">How do you want your money?</legend>
              <MethodOption method="cash" current={method} onPick={setMethod} icon={<Store className="size-5" aria-hidden />} title="Cash at a shop" fee={feeLabel('cash')}
                body={`No bank account needed. Get an SMS voucher and collect cash with your PIN at ${CASH_SHOPS}.`} />
              <MethodOption method="bank" current={method} onPick={setMethod} icon={<Landmark className="size-5" aria-hidden />} title="My bank account" fee={feeLabel('bank')}
                body="Any South African bank account. Some banks, such as TymeBank, open a free account with just your ID at kiosks in Boxer and Pick n Pay." />
            </fieldset>

            {method === 'bank' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bank" htmlFor="bank">
                  <select id="bank" className="input" value={bank} onChange={(e) => setBank(e.target.value)}>
                    <option value="">Choose your bank</option>
                    {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Last 4 digits of your account" htmlFor="last4" hint="We never ask for your PIN or password.">
                  <input id="last4" className="input" inputMode="numeric" autoComplete="off" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} />
                </Field>
              </div>
            )}

            <Field label="Amount" htmlFor="amount" hint={`From R50 to ${formatRand(maxCents)}${method === 'cash' ? ' (cash vouchers: up to R5 000 a day)' : ''}.`}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center font-bold text-muted">R</span>
                  <input id="amount" type="number" inputMode="decimal" min={50} step={0.01} className="input pl-8 text-lg font-bold" placeholder="200"
                    value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <Button variant="secondary" onClick={() => setAmount(String(maxCents / 100))}>All</Button>
              </div>
            </Field>

            {cents >= CASHOUT_MIN_CENTS && cents > fee && (
              <p className="rounded-xl bg-canvas px-4 py-3 text-sm">
                You receive <strong>{formatRand(cents - fee)}</strong>{fee ? ` (${formatRand(fee)} cash-out fee)` : ' — this cash-out is free'}.
              </p>
            )}
            {error && <p role="alert" className="rounded-lg bg-clay-50 px-3 py-2 text-sm font-medium text-clay-700">{error}</p>}
            <Button type="submit" size="lg" block loading={busy}>{method === 'cash' ? 'Send me a cash voucher' : 'Pay into my bank account'}</Button>
          </Card>
        </form>
      ) : (
        <Card className="mt-4 p-5 text-sm text-muted">
          You can cash out from R50. When a client confirms a job, your money lands here. <Link to="/my-work" className="font-semibold text-brand-700 underline">Go to My work</Link>
        </Card>
      )}

      <section aria-labelledby="history-h" className="mt-6">
        <h2 id="history-h" className="mb-3 text-lg font-bold">Recent cash-outs</h2>
        {w.cashouts.length === 0 ? (
          <p className="card p-4 text-sm text-muted">No cash-outs yet.</p>
        ) : (
          <ul className="space-y-3">{w.cashouts.map((c) => <CashoutRow key={c.id} c={c} />)}</ul>
        )}
      </section>

      <div className="mt-6 space-y-3">
        {profile?.is_demo && (
          <p className="rounded-lg bg-sun-50 px-3 py-2 text-xs font-medium text-sun-700 ring-1 ring-inset ring-sun-100">
            <strong>Shared demo account.</strong> Cash-outs reset after 30 minutes so the next person can try.
          </p>
        )}
        <SimulationNote>No real money moves. In the live version a licensed banking partner holds your earnings and sends each payout; SideGigs never holds your money itself.</SimulationNote>
      </div>
    </div>
  )
}
