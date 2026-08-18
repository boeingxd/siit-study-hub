# SIIT Study Hub

A SIIT-gated archive of student-authored study material and structured exam
intelligence, organized by course code — so what an exam actually covers,
how hard a course is, and what to study stops living in LINE groups and
expiring Drive links and starts persisting across cohorts.

**Live:** https://boeingxd.github.io/siit-study-hub/

Access is gated to `@g.siit.tu.ac.th` accounts via magic-link sign-in,
enforced at the database layer, not just the UI.

## Status

Working MVP. Built:

- Magic-link auth, gated to SIIT student emails
- Onboarding (pseudonymous handle, program, year)
- Course catalogue — 31 real Digital Engineering courses, sourced from
  SIIT's official 2023 Undergraduate Catalog
- Search/browse by course code or title
- Course pages with Exam Intel / Materials tabs (read path; submission
  forms are the next milestone)

Not yet built: contributing exam intel or materials, instructor/section
reviews, monetization.

## Stack

Vite + React + TypeScript, deployed to GitHub Pages via GitHub Actions.
Supabase (Postgres, Auth, Storage) as the entire backend — all access
control lives in Row Level Security, never trusted to the frontend.

## Docs

- [`docs/PLAN.md`](docs/PLAN.md) — full design plan, data model, security
  model, and business model
- [`DESIGN.md`](DESIGN.md) — the visual design system ("Engineering Lab
  Notebook")
- [`CLAUDE.md`](CLAUDE.md) — guidance for AI coding assistants working in
  this repo

## Local development

```sh
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```
