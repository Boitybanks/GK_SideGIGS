import { Link } from 'react-router-dom'

/** Mark: a location pin holding a check — local work, verified. */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0b7a4b" />
      <path d="M16 6.5c-4.4 0-7.8 3.3-7.8 7.6 0 5.4 6.4 10.6 7.2 11.3.35.3.85.3 1.2 0 .8-.7 7.2-5.9 7.2-11.3 0-4.3-3.4-7.6-7.8-7.6Z" fill="#ffb612" />
      <path d="m12.6 14.2 2.4 2.4 4.6-4.8" fill="none" stroke="#06472c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg" aria-label="SideGigs home">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Side<span className="text-brand-600">Gigs</span>
      </span>
    </Link>
  )
}
