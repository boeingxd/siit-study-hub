# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: SIIT (Sirindhorn International Institute of Technology, Thammasat University) students, starting with the Digital Engineering (DE) program — the seeded course catalogue is DE's major courses. A 3rd-year DE student is the founding user and first content contributor. Secondary/future: the rest of SIIT's student body, once the DE cohort proves the model.

Job to be done: before or during a course, look up what the exams actually demand — format, topic coverage, difficulty, allowed aids — and find student-written notes/summaries, so they stop rediscovering the same information every cohort. Once they've taken a course, they come back to contribute what they learned for the next cohort.

## Product Purpose

SIIT Study Hub is a SIIT-gated archive of student-authored study material and structured exam intelligence, organized by course code. It exists because course knowledge currently lives in LINE groups, senior handoffs, and Google Drive links that rot between cohorts — every intake rediscovers it from scratch. Success is a course page that's actually useful the first time a student opens it, and a cohort willing to keep it fed.

## Positioning

Two deliberate choices a copycat can't casually replicate:

- **Exam intel, not exam papers.** Structured, comparable reports (format, coverage, allowed aids, difficulty, time pressure) rather than redistributed official exams. Keeps most of the practical value while avoiding the copyright/academic-integrity problem a raw-paper archive would have — and gives a straight answer when someone challenges that in a pitch.
- **Verified-student, pseudonymous.** `@g.siit.tu.ac.th` email gating proves membership without needing institutional integration; contributors post under a handle (real name is opt-in per contribution). This is what makes candid reporting ("the professor doesn't follow the syllabus," "grading is harsh") survivable, which a fully anonymous or fully real-name system each fail at differently.

## Operating Context

A student signs in once (magic link), then returns repeatedly around registration and exam periods to check a course before committing, or to look up exam intel while studying. Contribution happens right after taking an exam or finishing a course, while the details are fresh. The whole product is a single web app — no companion tools, no offline mode, no institutional system integration (this is deliberately outside SIIT's own systems).

## Capabilities and Constraints

**Current (built):**
- Magic-link auth gated to `@g.siit.tu.ac.th`, enforced at the database layer (not just the UI).
- Pseudonymous profiles (handle public, real name private unless opted in per contribution).
- Course catalogue (seeded from SIIT's official curriculum, DE program first), searchable/browsable by code or title.
- Course page with Exam Intel and Materials tabs — schema and read path exist; the submission (write) path is not yet built.

**Technical constraints:**
- Static hosting on GitHub Pages (no server-side code) — Supabase (Postgres + Auth + Storage) is the entire backend, reached directly from the browser.
- All access control lives in Supabase Row Level Security; nothing in the frontend is trusted as a security boundary.
- Public repo (GitHub Pages free tier requires it) — application code is public; user content is not (gated behind auth + RLS).

**Explicitly undecided / not yet built:** instructor/section reviews, a LINE mini-app, AI-assisted exam prep synthesis — all deferred, schema left open for reviews specifically.

## Brand Commitments

Name: **SIIT Study Hub** (locked in). No existing logo, color identity, or visual assets yet — this redesign is establishing the first real visual identity, not matching one.

## Evidence on Hand

No real user content yet (pre-launch): no student testimonials, no populated exam intel or materials, no usage data. The only real content is the course catalogue itself (31 real DE course codes/titles/credits, sourced from SIIT's official 2023 Undergraduate Catalog). Design and copy must not fabricate testimonials, activity, or contributor counts to look more populated than it is — empty states are real empty states.

## Product Principles

- **Trustworthy over exciting.** This asks students to hand over academic-integrity-adjacent, occasionally unflattering opinions about real courses and instructors. The product has to read as safe and credible before anything else.
- **The course code is the anchor.** Everything is organized by course code; it should be the most legible, consistently-treated piece of data on every screen.
- **Honest emptiness.** Pre-launch, most course pages have nothing in them yet. Empty states must say so plainly and invite contribution — never fake activity or dead-end silently.
- **Institutional, not corporate-SaaS.** This is a piece of school infrastructure students will use between classes on a phone, not a startup product being sold to them.

## Accessibility & Inclusion

Standard good practice: keyboard navigable, visible focus states, sufficient contrast, respects reduced-motion preference. No further requirement specified.
