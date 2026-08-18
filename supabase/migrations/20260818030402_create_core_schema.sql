-- Core schema for SIIT Study Hub.
-- See docs/PLAN.md for the data model rationale.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- courses: catalogue, seeded up front so every course page exists on day one
-- ---------------------------------------------------------------------------
create table public.courses (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  title      text not null,
  program    text,
  credits    smallint,
  created_at timestamptz not null default now()
);

comment on table public.courses is 'Course catalogue, seeded from the published curriculum.';

-- ---------------------------------------------------------------------------
-- profiles: one per authenticated user, id mirrors auth.users(id)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  handle      text not null unique,
  real_name   text,
  program     text,
  year        smallint,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint handle_length check (char_length(handle) between 3 and 32)
);

comment on table public.profiles is 'Public handle + private real name; real_name is only shown when the author opts in per-contribution.';

-- ---------------------------------------------------------------------------
-- exam_intel: structured exam reports, the archive's differentiator
-- ---------------------------------------------------------------------------
create table public.exam_intel (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  exam_type      text not null check (exam_type in ('midterm', 'final', 'quiz')),
  semester       text not null,
  instructor     text,
  format         text[] not null default '{}',
  topics         text[] not null default '{}',
  allowed_aids   text check (allowed_aids in ('none', 'one_sheet', 'open_book', 'calculator')),
  duration_min   integer check (duration_min > 0),
  time_pressure  smallint not null check (time_pressure between 1 and 5),
  difficulty     smallint not null check (difficulty between 1 and 5),
  advice         text,
  credit_by_name boolean not null default false,
  created_at     timestamptz not null default now()
);

comment on table public.exam_intel is 'Structured exam reports: format, coverage, aids, difficulty. Never redistributed exam papers.';

create index exam_intel_course_id_idx on public.exam_intel (course_id);
create index exam_intel_author_id_idx on public.exam_intel (author_id);

-- ---------------------------------------------------------------------------
-- materials: student-authored notes/summaries/cheat sheets
-- ---------------------------------------------------------------------------
create table public.materials (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  type           text not null check (type in ('summary', 'cheat_sheet', 'notes', 'worked_problems')),
  semester       text,
  instructor     text,
  body_md        text,
  file_path      text,
  credit_by_name boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint materials_has_content check (body_md is not null or file_path is not null)
);

comment on table public.materials is 'Student-authored study material only — no official exam papers or copyrighted slides.';

create index materials_course_id_idx on public.materials (course_id);
create index materials_author_id_idx on public.materials (author_id);

-- ---------------------------------------------------------------------------
-- votes: quality signal, one vote per user per target
-- ---------------------------------------------------------------------------
create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('exam_intel', 'materials')),
  target_id   uuid not null,
  value       smallint not null default 1 check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index votes_target_idx on public.votes (target_type, target_id);

-- ---------------------------------------------------------------------------
-- reports: moderation queue
-- ---------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('exam_intel', 'materials')),
  target_id   uuid not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index reports_unresolved_idx on public.reports (resolved) where resolved = false;
