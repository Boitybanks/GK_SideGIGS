import { Suspense } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Briefcase, Compass, PlusCircle, User, Users, Award, Home, LogIn } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Logo } from './Logo'
import { DemoSwitcher } from '../DemoSwitcher'
import { buttonClass, Spinner } from '../ui'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

function useNavItems(): NavItem[] {
  const { userId, profile } = useAuth()
  if (!userId) {
    return [
      { to: '/', label: 'Home', icon: Home, end: true },
      { to: '/discover', label: 'Find work', icon: Compass },
      { to: '/workers', label: 'Workers', icon: Users },
      { to: '/impact', label: 'Impact', icon: BarChart3 },
      { to: '/login', label: 'Sign in', icon: LogIn },
    ]
  }
  if (profile?.role === 'customer') {
    return [
      { to: '/my-gigs', label: 'My gigs', icon: Briefcase },
      { to: '/gigs/new', label: 'Post a gig', icon: PlusCircle },
      { to: '/workers', label: 'Workers', icon: Users },
      { to: '/impact', label: 'Impact', icon: BarChart3 },
      { to: '/profile', label: 'Profile', icon: User },
    ]
  }
  return [
    { to: '/discover', label: 'Find work', icon: Compass },
    { to: '/my-work', label: 'My work', icon: Briefcase },
    { to: `/w/${userId}`, label: 'Portfolio', icon: Award },
    { to: '/impact', label: 'Impact', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: User },
  ]
}

export function AppShell() {
  const items = useNavItems()
  const { userId, profile } = useAuth()
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur supports-[backdrop-filter]:bg-canvas/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo to={userId ? (profile?.role === 'customer' ? '/my-gigs' : '/discover') : '/'} />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {!userId && (
            <NavLink to="/signup" className={buttonClass('primary', 'sm')}>
              Join free
            </NavLink>
          )}
        </div>
      </header>

      <DemoSwitcher />

      <main id="main" className={`flex-1 ${isLanding ? '' : 'mx-auto w-full max-w-6xl px-4 py-6 sm:py-8'} pb-28 md:pb-12`}>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="hidden border-t border-line bg-white/60 md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted">
          <p>
            <strong className="text-ink">SideGigs</strong> — Find work. Get it done. Build your name. Built by team CodeCraft.
          </p>
          <nav aria-label="Footer" className="flex gap-4">
            <NavLink to="/trust" className="hover:text-ink">Trust &amp; safety</NavLink>
            <NavLink to="/verify" className="hover:text-ink">Verify a record</NavLink>
            <NavLink to="/impact" className="hover:text-ink">Impact</NavLink>
          </nav>
        </div>
      </footer>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                    isActive ? 'text-brand-700' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-7 w-12 place-items-center rounded-full ${isActive ? 'bg-brand-50' : ''}`}>
                      <item.icon className="size-5" aria-hidden />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
