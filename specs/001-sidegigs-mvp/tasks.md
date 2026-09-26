# Tasks: SideGigs MVP

Format: `[ID] [P?] [Story] Description` — IDs map to `docs/implementation-plan.md`. Shared task state (Beads unavailable on this machine — see run-log).

## Phase 1: Setup
- [x] S001 Project scaffold (Vite/React/TS/Tailwind), lint/test config, .gitignore
- [x] S002 Supabase project `SideGigs` (eu-west-2), Spec Kit init

## Phase 2: Foundational (blocks all stories)
- [ ] T1 [US1,US2] Migration: tables, RLS, private helpers, RPCs, storage, seed data
- [ ] T2 [P] Domain library + unit tests (fees, geo, rules, validation)
- [ ] T3 [P] [US3,US4] PQ crypto library, key script, Netlify functions + tests
- [ ] T4 App shell, routing, layout, design tokens

## Phase 3: US1 + US2 core journey (P1) 🎯
- [ ] T5 Auth, sign-up, demo login, onboarding, profile edit
- [ ] T6 Post gig with live fee breakdown + encrypted address
- [ ] T7 Discover (distance/category/skills, pagination) + gig detail
- [ ] T8 Apply/withdraw, applicants list, select, start, done, confirm, cancel, timeline, payment panel
- [ ] T9 Review, auto portfolio record, public worker profile, My Work/My Gigs

## Phase 4: US3–US5
- [ ] T10 Payment simulation surfaces
- [ ] T11 Impact dashboard
- [ ] T12 Evidence upload, signed credential download, /verify
- [ ] T13 Report pathway, Trust & safety page

## Phase 5: Release
- [ ] T14 Netlify deploy, env/secrets, production smoke (Playwright), release report
- [ ] T15 Polish

## Dependencies
T1 → T5..T13 · T2/T3 parallel with T1 · T4 → all UI · T14 after P0 tasks.
