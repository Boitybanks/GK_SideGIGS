import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, FileJson, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { SignedCredential } from '../lib/pq/credential'
import { categoryLabel } from '../lib/categories'
import { formatDate } from '../lib/format'
import { Button, Card, DemoBadge, PageHeader, Stars } from '../components/ui'

type Result = { ok: true; signed: SignedCredential } | { ok: false; reason: string } | null

async function verifyText(text: string): Promise<Result> {
  let signed: SignedCredential
  try {
    signed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'That is not a SideGigs work record file (invalid JSON).' }
  }
  const [{ verifyCredential }, { fromBase64 }, keys] = await Promise.all([
    import('../lib/pq/credential'),
    import('../lib/pq/bytes'),
    import('../lib/pq-public-keys'),
  ])
  if (signed?.kid !== keys.SIGN_KID) return { ok: false, reason: 'This record was not signed with the SideGigs signing key.' }
  const ok = verifyCredential(signed, fromBase64(keys.SIGN_PUBLIC_KEY_B64))
  return ok ? { ok: true, signed } : { ok: false, reason: 'The signature does not match. The record has been changed or was not issued by SideGigs.' }
}

export default function Verify() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result>(null)
  const [busy, setBusy] = useState(false)

  async function run(input: string) {
    setBusy(true)
    setResult(await verifyText(input))
    setBusy(false)
  }

  const c = result?.ok ? result.signed.credential : null

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Verify a SideGigs work record" subtitle="Check that a worker’s downloaded history is genuine and unchanged." />
      <Card className="p-5">
        <p className="text-sm text-muted">
          Workers can download their verified history from their portfolio. It is signed with <strong>ML-DSA-65</strong> (NIST FIPS 204), a
          post-quantum digital signature. Verification happens right here in your browser using SideGigs’ public key — nothing is uploaded.
        </p>
        <label htmlFor="record-file" className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-6 font-semibold text-ink-soft hover:border-brand-200">
          <FileJson className="size-5" aria-hidden /> Choose a work record file (.json)
        </label>
        <input id="record-file" type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          const t = await f.text()
          setText(t)
          await run(t)
        }} />
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">Or paste the record</summary>
          <label htmlFor="record-text" className="sr-only">Record JSON</label>
          <textarea id="record-text" rows={6} className="input mt-2 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
          <Button className="mt-2" size="sm" loading={busy} disabled={!text.trim()} onClick={() => run(text)}>Verify</Button>
        </details>
      </Card>

      {result && !result.ok && (
        <div role="alert" className="mt-4 flex gap-3 rounded-2xl bg-clay-50 p-5 text-clay-700 ring-1 ring-clay-100">
          <ShieldAlert className="size-6 shrink-0" aria-hidden />
          <div><p className="font-bold">Not verified</p><p className="text-sm">{result.reason}</p></div>
        </div>
      )}

      {c && (
        <div className="mt-4 space-y-3" role="status">
          <div className="flex gap-3 rounded-2xl bg-brand-600 p-5 text-white">
            <ShieldCheck className="size-7 shrink-0" aria-hidden />
            <div>
              <p className="text-lg font-bold">Genuine SideGigs record</p>
              <p className="text-sm text-brand-50">Signature valid · issued {formatDate(c.issued_at)} · unchanged since signing.</p>
            </div>
          </div>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold">{c.worker.name}</h2>
              {c.demo_data && <DemoBadge />}
            </div>
            <p className="text-sm text-muted">{c.worker.area} · on SideGigs since {formatDate(c.worker.member_since)}</p>
            <p className="mt-2 text-sm">
              <strong>{c.summary.completed_gigs}</strong> verified gigs · average rating <strong>{c.summary.average_rating ?? '—'}</strong> from {c.summary.reviews} reviews · <strong>{c.summary.repeat_customers}</strong> repeat customers
            </p>
            <Link to={c.profile_url.replace(/^https?:\/\/[^/]+/, '')} className="mt-2 inline-block text-sm font-semibold text-brand-700 underline">See live profile</Link>
            <ul className="mt-4 space-y-2">
              {c.records.map((r) => (
                <li key={r.code} className="rounded-xl bg-canvas p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold"><BadgeCheck className="mr-1 inline size-4 text-brand-600" aria-hidden />{r.title}</p>
                    {r.rating && <Stars value={r.rating} />}
                  </div>
                  <p className="text-xs text-muted">{categoryLabel(r.category)} · {r.area} · {formatDate(r.completed_at)} · for {r.customer} · <code>{r.code}</code></p>
                  {r.review && <p className="mt-1">“{r.review}”</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
