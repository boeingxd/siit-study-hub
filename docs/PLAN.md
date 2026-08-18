# SIIT Study Hub — Design Plan

## Context

SIIT students lose institutional knowledge every year. What a course actually
demands — the real workload, what the midterm looks like, which topics matter —
lives in LINE groups, senior handoffs, and Google Drive links that rot between
cohorts. Every intake rediscovers it from scratch.

This project builds a **SIIT-gated archive of student-authored study material and
structured exam intelligence**, organized by course code. It is the first phase of
a product whose later phases add instructor reviews, a LINE mini-app, and
AI-assisted exam prep.

Deliberate choices already settled during brainstorming:

- **Exam intel, not exam papers.** Structured descriptions of exams (format,
  coverage, allowed aids, difficulty) rather than redistributed official papers.
  Keeps most of the value, avoids the copyright and academic-integrity fight, and
  gives a clean answer when someone challenges it in the pitch Q&A.
- **Gated and pseudonymous.** `@g.siit.tu.ac.th` verification proves membership
  without institutional integration; handles keep people honest, especially once
  reviews land in phase 2.
- **Archive first, reviews later.** One uploaded note has standalone value; one
  review on an empty review site has none.

Bar for this semester is a working demo, but architected so it could genuinely
open to students.

## Stack

- **Vite + React** (not Next.js — its server features are unusable on static
  hosting), TypeScript
- **GitHub Pages** via GitHub Actions, with `404.html` SPA fallback and Vite
  `base: '/siit-study-hub/'` for the repo subdirectory
- **Supabase free tier** — magic-link auth, Postgres, file storage, RLS
- **Vitest** + **Playwright** for tests

Repo: `boeingxd/siit-study-hub`, public (free-plan Pages requires public).
Live at `https://boeingxd.github.io/siit-study-hub/`. Total hosting cost: $0.

## Data model

| Table | Purpose | Key fields |
|---|---|---|
| `courses` | Catalogue, seeded up front | `code`, `title`, `program`, `credits` |
| `profiles` | One per auth user | `handle` (unique, public), `real_name` (private), `program`, `year`, `is_admin` |
| `exam_intel` | The differentiator | `course_id`, `exam_type`, `semester`, `instructor`, `format[]`, `topics`, `allowed_aids`, `duration_min`, `time_pressure` (1–5), `difficulty` (1–5), `advice`, `author_id`, `credit_by_name` |
| `materials` | Student-authored content | `course_id`, `title`, `type`, `semester`, `instructor`, `body_md`, `file_path`, `author_id`, `credit_by_name` |
| `votes` | Quality signal | `user_id`, `target_type`, `target_id`, unique per user per target |
| `reports` | Moderation queue | `target_type`, `target_id`, `reason`, `reporter_id`, `resolved` |

Course pages render exam intel as an **aggregate** (mean difficulty, mean time
pressure, most-cited topics, submission count) above the individual entries.
This is what makes five sparse submissions feel substantial — critical at demo
time.

Schema leaves room for a phase-2 `reviews` table; do not build it now.

## Security

**Every access rule lives in Supabase, never in frontend code.** The Supabase
anon key ships in the public JS bundle by design; anyone can edit the bundle.

- Domain gate: auth hook or `auth.users` trigger rejecting non-`@g.siit.tu.ac.th`
  signups, *plus* RLS policies asserting the JWT email claim matches the domain.
  Both layers — the trigger alone is bypassable if an account is ever created by
  another path.
- Content tables: `SELECT` for authenticated SIIT users only; `INSERT` must set
  `author_id = auth.uid()`; `UPDATE`/`DELETE` restricted to own rows.
- Storage bucket: authenticated read, own-path insert, explicit size and MIME
  limits.
- Admin view gated on `profiles.is_admin`.

## Build phases

**Phase 0 — Repository** ✅ done
`git init`, `.gitignore` written before the first commit, public repo created at
`boeingxd/siit-study-hub`, pushed and verified.

Secret handling, decided now rather than later: the Supabase **anon** key is
public by design and ships in the bundle, so it goes in `.env` for local dev and
a repo variable for CI. The **service role** key never touches this repo, CI, or
any frontend code.

**Phase 1 — Foundation**
Scaffold Vite + React + TS. Supabase project, schema migrations, RLS policies.
GitHub Actions deploy to Pages with SPA fallback and correct base path. Verify a
deployed page loads before writing features.

**Phase 2 — Auth**
Magic-link sign-in, domain rejection with a clear error message, onboarding
screen (handle, program, year) creating the profile row, session handling,
protected routes. Verify the Supabase redirect allow-list includes the Pages URL —
this is the most common thing to get wrong on static hosting.

**Phase 3 — Read path**
Seed the course catalogue. Search and browse by code or title. Course page shell
with Exam Intel and Materials tabs. Empty states that invite contribution rather
than dead-end.

**Phase 4 — Write path**
Exam-intel form (target: under two minutes to complete). Material submission with
markdown body and optional file upload. Per-contribution "credit me by name"
toggle. Aggregation logic on the course page.

**Phase 5 — Quality and moderation**
Votes, report button, admin review view, content policy page.

**Phase 6 — Seed and harden**
Fill exam intel for courses already taken; recruit classmates within one program
and year-level. Depth in one cohort, not breadth across SIIT.

## Out of scope

Instructor reviews, LINE mini-app, AI synthesis, comments, notifications,
real-time updates, mobile apps. Reviews are phase 2 and the schema accommodates
them; nothing else gets designed for now.

## Verification

- **Vitest** — aggregation math, form validation, domain-check helpers.
- **Playwright** — critical path end to end: sign in → onboard → submit exam
  intel → see it aggregated on the course page.
- **Security proof, run against the deployed site, not localhost:**
  - A non-`@g.siit.tu.ac.th` address cannot create an account.
  - An unauthenticated `supabase-js` client cannot read `exam_intel` or
    `materials` (call the API directly with the public anon key — this is the
    test that proves RLS works, since the UI will happily hide data it still
    fetches).
  - A signed-in user cannot update another user's row.
- **Manual** — magic-link redirect resolves correctly on the GitHub Pages URL,
  deep links survive refresh (404.html fallback), layout holds on a phone.

## Open

Product name. Worth deciding before the pitch, not before the build.
