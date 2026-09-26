import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, CalendarCheck, Download, MapPin, Repeat, Share2, ShieldCheck, Star } from 'lucide-react'
import { fetchPortfolio, fetchProfile, fetchWorkCredential, fetchWorkerStats } from '../lib/api'
import { useAuth } from '../lib/auth'
import { categoryEmoji, categoryLabel } from '../lib/categories'
import { friendlyError } from '../lib/errors'
import { formatMonthYear, percent } from '../lib/format'
import { useAreaLookup } from '../lib/hooks'
import { Avatar, Button, ButtonLink, Card, DemoBadge, EmptyState, ErrorState, Spinner } from '../components/ui'
import { useToast } from '../components/ui/toast'
import { PortfolioRecord } from '../components/portfolio/PortfolioRecord'
import { ReportButton } from '../components/ReportButton'
import NotFound from './NotFound'

export default function WorkerProfile() {
  const { id = '' } = useParams()
  const { hash } = useLocation()
  const { userId } = useAuth()
  const toast = useToast()
  const areaOf = useAreaLookup()
  const [downloading, setDownloading] = useState(false)
  const isOwner = userId === id

  const profileQ = useQuery({ queryKey: ['profile', id], queryFn: () => fetchProfile(id) })
  const statsQ = useQuery({ queryKey: ['worker-stats', id], queryFn: () => fetchWorkerStats(id) })
  const portfolioQ = useQuery({ queryKey: ['portfolio', id], queryFn: () => fetchPortfolio(id) })
  const highlighted = hash ? decodeURIComponent(hash.slice(1)) : ''

  useEffect(() => {
    if (highlighted && portfolioQ.data) document.getElementById(highlighted)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlighted, portfolioQ.data])

  if (profileQ.isPending) return <Spinner label="Loading portfolio…" />
  if (profileQ.isError) return <ErrorState error={profileQ.error} onRetry={() => profileQ.refetch()} />
  const p = profileQ.data
  if (!p) return <NotFound what="profile" />

  const s = statsQ.data
  const items = portfolioQ.data ?? []
  const area = areaOf(p.area_slug)
  const resolved = s ? s.completed + s.cancelled_after_match : 0
  const first = p.display_name.split(' ')[0]

  async function share() {
    const url = `${window.location.origin}/w/${p!.id}`
    try {
      if (navigator.share) await navigator.share({ title: `${p!.display_name} on SideGigs`, text: `See ${first}’s verified work on SideGigs`, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.show('Profile link copied. Paste it in WhatsApp, a CV or an email.')
      }
    } catch {
      /* dismissed */
    }
  }

  async function downloadRecord() {
    setDownloading(true)
    try {
      const signed = await fetchWorkCredential(p!.id)
      const blob = new Blob([JSON.stringify(signed, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `sidegigs-work-record-${p!.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.show('Signed work record downloaded. Anyone can check it at SideGigs → Verify.')
    } catch (e) {
      toast.show(friendlyError(e), 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="overflow-hidden">
        <div className="kasi-pattern h-20 bg-brand-700" aria-hidden />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <span className="rounded-full ring-4 ring-white"><Avatar name={p.display_name} id={p.id} size="xl" /></span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={share}><Share2 className="size-4" aria-hidden /> Share</Button>
              {isOwner && <ButtonLink to="/profile" variant="secondary" size="sm">Edit</ButtonLink>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold">{p.display_name}</h1>
            {p.is_demo && <DemoBadge />}
          </div>
          {p.headline && <p className="mt-0.5 text-ink-soft">{p.headline}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{area ? `${area.name}, ${area.city}` : p.area_slug}</span>
            <span className="inline-flex items-center gap-1"><CalendarCheck className="size-4" aria-hidden />On SideGigs since {formatMonthYear(p.created_at)}</span>
          </p>
          {p.bio && <p className="mt-3 whitespace-pre-line">{p.bio}</p>}
          {p.skills.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">What {first} can do</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {p.skills.map((sk) => (
                  <li key={sk} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">
                    <span aria-hidden>{categoryEmoji(sk)}</span> {categoryLabel(sk)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {p.role === 'worker' || items.length > 0 ? (
        <>
          <section aria-label="Reputation" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: BadgeCheck, value: s?.completed ?? '—', label: 'verified gigs', color: 'text-brand-600' },
              { icon: Star, value: s?.avg_rating ?? 'New', label: s ? `rating · ${s.review_count} review${s.review_count === 1 ? '' : 's'}` : 'rating', color: 'text-sun-600' },
              { icon: Repeat, value: s?.repeat_customers ?? '—', label: 'repeat customers', color: 'text-clay-600' },
              { icon: ShieldCheck, value: resolved ? percent(s!.completed / resolved) : '—', label: 'of accepted gigs completed', color: 'text-brand-600' },
            ].map((x) => (
              <Card key={x.label} className="p-4">
                <x.icon className={`size-5 ${x.color}`} aria-hidden />
                <p className="mt-2 text-2xl font-extrabold">{x.value}</p>
                <p className="text-xs text-muted">{x.label}</p>
              </Card>
            ))}
          </section>

          <Card className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <ShieldCheck className="size-8 shrink-0 text-brand-600" aria-hidden />
            <p className="flex-1 text-sm">
              <strong>Portable proof of work.</strong> Download {isOwner ? 'your' : `${first}’s`} history signed with ML-DSA-65, a quantum-resistant
              signature. Anyone can check it at <Link to="/verify" className="font-semibold text-brand-700 underline">SideGigs Verify</Link>.
            </p>
            <Button variant="secondary" size="sm" loading={downloading} onClick={downloadRecord}><Download className="size-4" aria-hidden /> Signed record</Button>
          </Card>

          <section aria-labelledby="records-h" className="mt-6">
            <h2 id="records-h" className="mb-1 text-xl font-extrabold">What {isOwner ? 'you have' : `${first} has`} done</h2>
            <p className="mb-3 text-sm text-muted">Each record was created by SideGigs when the customer confirmed the job — not self-reported.</p>
            {portfolioQ.isPending ? <Spinner /> : portfolioQ.isError ? <ErrorState error={portfolioQ.error} onRetry={() => portfolioQ.refetch()} /> : items.length === 0 ? (
              <EmptyState icon={<BadgeCheck className="size-5" aria-hidden />} title="No verified gigs yet"
                action={isOwner ? <ButtonLink to="/discover">Find your first gig</ButtonLink> : undefined}>
                {isOwner ? 'Complete a gig and the customer’s confirmation adds your first verified record here automatically.' : `${first} is new on SideGigs. Everyone starts somewhere!`}
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {items.map((item) => <PortfolioRecord key={item.id} item={item} isOwner={isOwner} highlighted={item.record_code === highlighted} />)}
              </div>
            )}
          </section>
        </>
      ) : (
        <Card className="mt-4 p-5 text-sm text-muted">{first} hires people on SideGigs.</Card>
      )}

      {!isOwner && (
        <div className="mt-6 flex justify-end">
          <ReportButton userId={p.id} label={`Report ${first}`} />
        </div>
      )}
    </div>
  )
}
