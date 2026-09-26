# Assumptions & autonomous decisions

| # | Decision / assumption | Why |
|---|---|---|
| A1 | Marketplace model: **workers apply, customer selects** (not first-come auto-accept). | Customer trust requires reviewing the worker's portfolio before hiring; this also makes the portfolio load-bearing. |
| A2 | Fee = 15% of payout, **added to the customer**, computed in the database (generated column), rounded to the cent. | Brief default; clients cannot tamper with the fee. |
| A3 | Payments are a **clearly labelled simulation** ("held" → "released"/"refunded"). No real money moves. | Real payment/escrow is regulated and out of hackathon scope. |
| A4 | Location = curated list of South African areas with approximate centre coordinates; distance shown as "about N km". Exact addresses are **never public**. | No maps API key needed; protects residential privacy. |
| A5 | Accounts are created through a database function (`create_account`) that creates a confirmed Supabase Auth user, then the client signs in with the password. | New hosted Supabase projects require email confirmation and the default mailer only sends to team members; judges must be able to sign up instantly. The function validates input and hashes passwords with bcrypt (same as Supabase Auth). |
| A6 | Every account has a primary mode (worker or customer) and can switch mode in Profile. | Many real users are both; keeps the UI focused. |
| A7 | Seeded demo data is flagged `is_demo` and shown with a "Demo" badge; the Impact dashboard reports live (non-demo) figures separately. | "No fabricated user data presented as production data." |
| A8 | "Quantum encryption" is interpreted as **post-quantum cryptography** (NIST FIPS 203/204), not quantum key distribution (which needs quantum hardware). | Only PQC is implementable in a web app today. See architecture §7. |
| A9 | Supabase region eu-west-2 (London). | Closest available Supabase region to South Africa in the connector's list. |
| A10 | Identity verification is **not** implemented; no "ID verified" claims. "Verified record" means *created by SideGigs from a customer-confirmed gig*. | Honest trust labels. |
| A11 | Work-evidence photos: images only (JPEG/PNG/WebP), ≤ 5 MB, stored in a public bucket under the worker's own folder. | Safe file restrictions; portfolio evidence is meant to be public. |
