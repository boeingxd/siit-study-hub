# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SIIT Study Hub: a SIIT-gated archive of student-authored study material and
structured exam intelligence, organized by course code. Full design context,
data model, phased build plan, and rationale for key decisions live in
@docs/PLAN.md — read it before making architectural changes.

## Stack

- Vite + React + TypeScript, deployed as a static build to GitHub Pages via
  GitHub Actions. Not Next.js — server-side features don't work on this host.
- Supabase free tier for auth (magic link), Postgres, and file storage.
- Vitest for unit tests, Playwright for end-to-end.
- Repo: `boeingxd/siit-study-hub` (public — GitHub Pages free tier requires a
  public repo). Live at `https://boeingxd.github.io/siit-study-hub/`.

## Non-obvious deployment requirements

- Vite `base` must be `'/siit-study-hub/'` (repo is served from a subpath, not
  the domain root).
- GitHub Pages has no server, so client-side routing needs the `404.html` SPA
  fallback trick or hash-based routes — a plain SPA route will 404 on refresh.
- Supabase's auth redirect allow-list must include the Pages URL, or magic-link
  sign-in will silently fail after deploy even though it works on localhost.

## Security model — read before touching auth or data access

**All access control lives in Supabase (RLS policies + a domain-gate trigger),
never in frontend code.** The Supabase anon key ships in the public JS bundle by
design, so any check written only in the frontend is decorative — assume it will
be bypassed.

- Signup must be rejected for any email outside `@g.siit.tu.ac.th`, enforced at
  the database layer (trigger/auth hook), not just in the UI.
- RLS: reads require authentication; inserts must set `author_id = auth.uid()`;
  updates/deletes are restricted to the row's own author.
- The Supabase **service role** key must never be committed, put in frontend
  code, or added to this repo in any form — only the anon key is meant to be
  public.
- When testing access control, don't test through the UI alone — call the
  Supabase REST API directly with the anon key and no session to confirm RLS
  actually blocks the read/write, since the UI can hide data it still fetched.
