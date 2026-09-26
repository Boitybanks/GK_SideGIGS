import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, Hammer } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { friendlyError } from '../lib/errors'
import type { Role } from '../lib/types'
import { firstError, signupSchema } from '../lib/validation'
import { Button, Card, Field } from '../components/ui'
import { AreaSelect } from '../components/AreaSelect'

const roleOptions: { value: Role; title: string; body: string; icon: typeof Hammer }[] = [
  { value: 'worker', title: 'I want to find work', body: 'Get paid for your skills and build a verified portfolio. Always free.', icon: Hammer },
  { value: 'customer', title: 'I need help with a task', body: 'Post a gig and hire someone nearby you can trust.', icon: Briefcase },
]

export default function Signup() {
  const { signUp, userId, profile } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const initialRole = params.get('role') === 'customer' ? 'customer' : params.get('role') === 'worker' ? 'worker' : ''
  const [form, setForm] = useState({ display_name: '', email: '', password: '', role: initialRole as Role | '', area_slug: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (userId && profile && !busy) return <Navigate to={profile.role === 'customer' ? '/my-gigs' : '/discover'} replace />

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const parsed = signupSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(firstError(parsed.error))
      return
    }
    setErrors({})
    setBusy(true)
    try {
      await signUp(parsed.data)
      navigate(parsed.data.role === 'worker' ? '/profile?welcome=1' : '/gigs/new?welcome=1', { replace: true })
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const err = (k: string) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `${k}-error` } : {})

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-extrabold">Join SideGigs</h1>
      <p className="mt-1 text-muted">Free for workers. Takes less than a minute.</p>
      <Card className="mt-6 p-5">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What do you want to do first?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleOptions.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                    form.role === r.value ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-line bg-white hover:border-brand-200'
                  }`}
                >
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => set('role', r.value)} className="sr-only" />
                  <r.icon className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
                  <span>
                    <span className="block font-bold">{r.title}</span>
                    <span className="block text-xs text-muted">{r.body}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.role && <p id="role-error" className="mt-1 text-sm font-medium text-clay-700">{errors.role}</p>}
            <p className="mt-2 text-xs text-muted">You can switch between finding work and hiring later.</p>
          </fieldset>

          <Field label="Your name" htmlFor="display_name" error={errors.display_name} hint="Shown on your profile, e.g. “Sipho Dlamini” or “Kasi Coffee Co.”">
            <input id="display_name" autoComplete="name" className="input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} {...err('display_name')} />
          </Field>
          <Field label="Your area" htmlFor="area" error={errors.area_slug} hint="Only your area is shown — never your address.">
            <AreaSelect id="area" value={form.area_slug} onChange={(v) => set('area_slug', v)} invalid={Boolean(errors.area_slug)} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" inputMode="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} {...err('email')} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
            <input id="password" type="password" autoComplete="new-password" className="input" value={form.password} onChange={(e) => set('password', e.target.value)} {...err('password')} />
          </Field>
          {formError && <p role="alert" className="rounded-lg bg-clay-50 px-3 py-2 text-sm font-medium text-clay-700">{formError}</p>}
          <Button type="submit" block size="lg" loading={busy}>Create my free account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
