# Release report

**PRODUCT:** SideGigs — team CodeCraft (Boitumelo, Mthandeki, Musa, Zanele)
**STATUS:** SHIPPED
**PUBLIC URL:** https://sidegigs-codecraft.netlify.app

| Check | Result |
|---|---|
| BUILD | PASS (`tsc -b` + `vite build`) |
| TYPECHECK / LINT | PASS / PASS (0 warnings) |
| TESTS | PASS — 27 unit tests (fees, lifecycle rules, validation, geo, PQ crypto round-trip/tamper/AAD, ML-DSA sign/verify/tamper, UI fee breakdown) + 12 live journey tests against production DB + 1 Playwright production journey (Pixel 7) |
| CRITICAL JOURNEY | PASS — post → discover → apply → choose → start → done → confirm → review → verified portfolio record → signed record verifies at `/verify`, zero console errors |
| DATABASE | Supabase `SideGigs` (eu-west-2), 5 migrations, RLS on all 11 tables, trust-bearing writes only via `security definer` RPCs; advisors: no errors |
| AUTH | Email + password; instant sign-up via validated `create_account` (no email-confirmation wait); demo logins protected (credentials immutable, profiles read-only) |
| NETLIFY | Site `sidegigs-codecraft`; SPA redirect, CSP/HSTS/X-Frame headers; functions `/api/reveal-contact`, `/api/work-credential` live; PQ seeds as secret env vars |

**Post-quantum security (team requirement):** addresses and phone numbers are encrypted in the browser with X-Wing (ML-KEM-768 + X25519) → AES-256-GCM; the DB stores ciphertext only; decryption happens server-side with the caller's JWT so RLS decides who can see it. Work histories are signed with ML-DSA-65 and verifiable by anyone.

## Known limitations (real)
- Payments are a labelled **simulation** — no PSP/escrow integration.
- No identity/background verification; "verified" = worker marked done + customer confirmed.
- Two colluding accounts can still create records for each other (next: account-age weighting, distinct-customer signals, PSP-backed payments).
- Sign-up throttle is global (30/min), not per IP; no captcha. Supabase "leaked password protection" is a dashboard setting not yet enabled.
- Report pathway only — no user block list yet. Reports have no admin console (read via database).
- No notifications (SMS/WhatsApp/push); gig pages poll every 8 s.
- Location is area-level (36 SA areas) — no maps/geocoding.
- Netlify's own dismissible "Powered by Netlify" badge overlaps the mobile tab bar until turned off in Netlify project settings.

## Demo accounts
Home page buttons **Try as Thandi** (customer) / **Try as Sipho** (worker), or `demo.customer@sidegigs.app` / `demo.worker@sidegigs.app`, password `SideGigsDemo2026`. All demo data is badged "Demo"; `/impact` can show real users only.

## Demo script (≤ 8 steps)
1. Open the URL on a phone → tap **Try as Thandi**.
2. **Post a gig**: pick a category, describe it, payout **R500** → see **R75 fee, R575 total**; add a street address (encrypted on-device) → **Publish**.
3. Tap **Switch to Sipho** → **Find work** shows it at the top ("In your area") → open → **Apply**.
4. **Switch to Thandi** → open the gig → see Sipho's verified gigs, rating and reviews → **Choose Sipho** (payment held — simulation) → **Decrypt and show** the address.
5. **Switch to Sipho** → **Start job** → **Mark as done**.
6. **Switch to Thandi** → **Confirm job is complete** → leave **5★** and a review.
7. Tap **Verified record SG-…** → Sipho's public portfolio shows the new record and review → **Share** or download the **Signed record** → check it at **/verify**.
8. Open **Impact**: people who earned, rand value earned, match rate, time to match.
