import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, Hammer, Lock, MapPin, ShieldCheck, Star, Wallet } from 'lucide-react'
import { fetchImpact } from '../lib/api'
import { formatRand } from '../lib/money'
import { ButtonLink } from '../components/ui'
import { DemoButtons } from '../components/DemoButtons'

function LiveStats() {
  const { data } = useQuery({ queryKey: ['impact', true], queryFn: () => fetchImpact(true) })
  if (!data) return <div className="h-[138px] animate-pulse rounded-2xl bg-white/10" />
  const stats = [
    { label: 'earned by workers', value: formatRand(data.income_earned_cents) },
    { label: 'people earned', value: String(data.people_earned) },
    { label: 'verified work records', value: String(data.portfolio_records) },
    { label: 'average rating', value: data.avg_rating ? `${Number(data.avg_rating).toFixed(1)}★` : '—' },
  ]
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <dl className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-brand-100">{s.label}</dt>
            <dd className="text-2xl font-extrabold text-white">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] text-brand-100">
        Live from the SideGigs database · includes labelled demo data · <Link to="/impact" className="underline">see impact</Link>
      </p>
    </div>
  )
}

const steps = [
  {
    icon: MapPin,
    title: 'Find work',
    body: 'See paid gigs near you — gardening, painting, tutoring, hair, repairs and more. Apply in one tap.',
  },
  {
    icon: Hammer,
    title: 'Get it done',
    body: 'Customers choose the person they trust, track progress and confirm when the job is done.',
  },
  {
    icon: BadgeCheck,
    title: 'Build your name',
    body: 'Every confirmed gig becomes a verified record with the customer’s rating — a portfolio you can share anywhere.',
  },
]

export default function Landing() {
  return (
    <div>
      <section className="kasi-pattern relative overflow-hidden bg-brand-700 text-white">
        <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-sun-400/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-20 size-80 rounded-full bg-clay-500/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sun-300 ring-1 ring-white/15">
              <MapPin className="size-3.5" aria-hidden /> Local work marketplace · South Africa
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Your work counts — <span className="text-sun-400">even when it didn’t happen behind a desk.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-50">
              Find paid work near you. Get trusted help for everyday tasks. Every completed gig becomes a verified record on your
              SideGigs portfolio.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/signup?role=worker" variant="sun" size="lg">
                Find work near me <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/signup?role=customer" size="lg" className="bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20">
                Get help with a task
              </ButtonLink>
            </div>
            <p className="mt-3 text-sm text-brand-100">Free for workers. Sign up in under a minute — no email confirmation wait.</p>
          </div>
          <div className="space-y-4">
            <LiveStats />
            <div className="rounded-2xl bg-white p-4 text-ink shadow-xl">
              <p className="text-sm font-bold">Judging SideGigs? Jump straight in:</p>
              <p className="mb-3 text-xs text-muted">Demo accounts use clearly labelled sample data. Switch sides any time.</p>
              <DemoButtons />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-extrabold">
          Find work. <span className="text-brand-600">Get it done.</span> <span className="text-clay-500">Build your name.</span>
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-bold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-clay-600">Every completed gig becomes career capital</p>
            <h2 className="mt-2 text-3xl font-extrabold">“Don’t only take my word for it. Here is the work I have actually done.”</h2>
            <p className="mt-3 text-muted">
              Painted 40 homes? Fixed hundreds of phones? On SideGigs that experience stops disappearing. When a customer confirms a job,
              SideGigs automatically adds a verified record — what you did, where, when, and what they said — to your public portfolio.
              You can even download a cryptographically signed copy to show anyone.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink to="/workers" variant="secondary">
                Browse worker portfolios
              </ButtonLink>
              <ButtonLink to="/verify" variant="ghost">
                How verification works
              </ButtonLink>
            </div>
          </div>
          <div className="card space-y-3 bg-canvas p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">What a verified record shows</p>
            {[
              { icon: BadgeCheck, t: 'Created only when the customer confirms completion — never self-reported' },
              { icon: Star, t: 'Star rating and written review from that customer' },
              { icon: MapPin, t: 'Skill category, area and date of the job' },
              { icon: ShieldCheck, t: 'A unique record code anyone can check' },
            ].map((row) => (
              <div key={row.t} className="flex gap-3 rounded-xl bg-white p-3">
                <row.icon className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                <p className="text-sm">{row.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <Wallet className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-3 text-2xl font-extrabold">Workers keep 100% of the payout</h2>
            <p className="mt-2 text-muted">SideGigs is free for workers. A transparent 15% protection fee is added for the customer.</p>
            <dl className="mt-5 space-y-2 rounded-xl bg-canvas p-4 text-sm">
              <div className="flex justify-between"><dt>Gig payout</dt><dd className="font-semibold">{formatRand(50000)}</dd></div>
              <div className="flex justify-between"><dt>SideGigs protection fee (15%)</dt><dd className="font-semibold">{formatRand(7500)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base"><dt className="font-bold">Customer pays</dt><dd className="font-extrabold">{formatRand(57500)}</dd></div>
              <div className="flex justify-between text-base text-brand-700"><dt className="font-bold">Worker earns</dt><dd className="font-extrabold">{formatRand(50000)}</dd></div>
            </dl>
          </div>
          <div className="card p-6">
            <Lock className="size-6 text-brand-600" aria-hidden />
            <h2 className="mt-3 text-2xl font-extrabold">Safety built in</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>• Only your area is public. Exact addresses and phone numbers are encrypted with post-quantum cryptography and revealed only to the person you’re matched with.</li>
              <li>• Reviews can only be left by the customer of a completed gig — one per job.</li>
              <li>• Report any gig or person in two taps.</li>
              <li>• Payments are simulated in this hackathon version and always labelled.</li>
            </ul>
            <Link to="/trust" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Read how we protect you <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">South Africa doesn’t lack capable people. It lacks ways to see them.</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: '8.5 million', l: 'people unemployed (official rate 33.6%)', s: 'Stats SA QLFS Q2 2026' },
              { v: '47.4%', l: 'youth unemployment, ages 15–34', s: 'Stats SA QLFS Q2 2026' },
              { v: '1.9 million', l: 'people run non-VAT-registered businesses', s: 'Stats SA SESE 2023' },
              { v: '34.3%', l: 'of informal businesses say they need marketing support', s: 'Stats SA SESE 2023' },
            ].map((x) => (
              <div key={x.v} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <dt className="text-3xl font-extrabold text-sun-400">{x.v}</dt>
                <dd className="mt-1 text-sm text-stone-200">{x.l}</dd>
                <dd className="mt-2 text-xs text-stone-400">{x.s}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-2xl text-sm text-stone-300">
            These figures show the scale of the opportunity — not proof that a platform is the answer. We are testing that with workers and customers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/signup?role=worker" variant="sun" size="lg">Join as a worker — free</ButtonLink>
            <ButtonLink to="/signup?role=customer" size="lg" className="bg-white text-ink hover:bg-stone-100">Post your first gig</ButtonLink>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted md:hidden">
        <p><strong className="text-ink">SideGigs</strong> by team CodeCraft — Boitumelo, Mthandeki, Musa &amp; Zanele.</p>
        <p className="mt-2 flex gap-4">
          <Link to="/trust" className="underline">Trust &amp; safety</Link>
          <Link to="/verify" className="underline">Verify a record</Link>
        </p>
      </footer>
    </div>
  )
}
