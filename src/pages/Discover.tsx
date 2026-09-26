import { useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Compass, Search } from 'lucide-react'
import { discoverGigs, PAGE_SIZE } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CATEGORIES } from '../lib/categories'
import { useAreaLookup } from '../lib/hooks'
import { Button, ButtonLink, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui'
import { GigCard } from '../components/gig/GigCard'
import { AreaSelect } from '../components/AreaSelect'

export default function Discover() {
  const { profile, userId } = useAuth()
  const areaOf = useAreaLookup()
  const [areaOverride, setAreaOverride] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const hasSkills = Boolean(profile?.skills?.length)
  const [skillsOnly, setSkillsOnly] = useState(false)

  const area = areaOverride ?? profile?.area_slug ?? ''
  const skills = skillsOnly && hasSkills ? profile!.skills : null

  const query = useInfiniteQuery({
    queryKey: ['discover', area, category, skills],
    queryFn: ({ pageParam }) => discoverGigs({ area: area || null, category, skills, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length === PAGE_SIZE ? pages.length : undefined),
  })
  const gigs = useMemo(() => query.data?.pages.flat() ?? [], [query.data])
  const skillSet = new Set(profile?.skills ?? [])

  return (
    <div>
      <PageHeader
        title="Find work near you"
        subtitle={area ? `Sorted by distance from ${areaOf(area)?.name ?? 'your area'}.` : 'Choose your area to see the closest gigs first.'}
        action={!userId ? <ButtonLink to="/signup?role=worker" size="sm">Join to apply</ButtonLink> : undefined}
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="area-filter" className="text-sm font-semibold sm:w-24">Near</label>
          <div className="sm:w-72">
            <AreaSelect id="area-filter" value={area} onChange={(v) => setAreaOverride(v)} placeholder="Anywhere in South Africa" />
          </div>
          {hasSkills && (
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold sm:ml-4">
              <input type="checkbox" className="size-5 accent-brand-600" checked={skillsOnly} onChange={(e) => setSkillsOnly(e.target.checked)} />
              Only gigs that match my skills
            </label>
          )}
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by category">
          <div className="flex w-max gap-2">
            <button type="button" className="chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
              All work
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.slug} type="button" className="chip" aria-pressed={category === c.slug} onClick={() => setCategory(category === c.slug ? null : c.slug)}>
                <span aria-hidden>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {query.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : gigs.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" aria-hidden />}
          title="No open gigs match yet"
          action={
            <Button variant="secondary" onClick={() => { setCategory(null); setSkillsOnly(false); setAreaOverride('') }}>
              Show all gigs
            </Button>
          }
        >
          Try another category or area. New gigs are posted every day — check back soon.
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted" aria-live="polite">
            <Compass className="mr-1 inline size-4" aria-hidden />
            {gigs.length}{query.hasNextPage ? '+' : ''} open gig{gigs.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} matchesSkills={skillSet.has(g.category)} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="mt-6 text-center">
              <Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                Load more gigs
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
