-- Domain gate + Row Level Security for SIIT Study Hub.
--
-- Everything here is the real security boundary. The frontend may add its own
-- pre-checks for UX, but none of them are trusted — see CLAUDE.md.

-- =============================================================================
-- 1. Domain gate: reject any account whose email is not @g.siit.tu.ac.th
-- =============================================================================
-- A DB trigger, not an Auth Hook: it's the mechanism whose semantics are
-- fully documented and verifiable, and it fires on every insert path
-- (including the admin API), not just the normal signup flow.
--
-- Covers both INSERT (new signup) and UPDATE OF email (an existing account
-- changing its address) — the update case is the one a pure "reject at
-- signup" trigger would miss.

create or replace function public.enforce_siit_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is null or new.email !~* '^[^@]+@g\.siit\.tu\.ac\.th$' then
    raise exception 'Only @g.siit.tu.ac.th accounts are allowed.'
      using errcode = '42501'; -- insufficient_privilege
  end if;
  return new;
end;
$$;

create trigger enforce_siit_email_on_write
  before insert or update of email on auth.users
  for each row
  execute function public.enforce_siit_email();

-- =============================================================================
-- 2. Helper functions used by RLS policies
-- =============================================================================

-- Defense in depth alongside the trigger above: confirms the *current
-- session's* JWT is actually a validated SIIT address, independent of
-- whatever created the underlying auth.users row.
create or replace function public.jwt_is_siit_email()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') ~* '^[^@]+@g\.siit\.tu\.ac\.th$', false);
$$;

-- Resolves to true only when the caller's own profile row is flagged admin.
-- No security definer needed: it only ever reads auth.uid()'s own row, which
-- the profiles select policy below already permits for that same user.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- =============================================================================
-- 3. Enable RLS on every table
-- =============================================================================
alter table public.courses    enable row level security;
alter table public.profiles   enable row level security;
alter table public.exam_intel enable row level security;
alter table public.materials  enable row level security;
alter table public.votes      enable row level security;
alter table public.reports    enable row level security;

-- Explicit grants: Supabase's default project privileges already grant these
-- to anon/authenticated, but stating them here removes any doubt — and the
-- anon revokes make the "nothing works until you're signed in with a SIIT
-- email" intent unmistakable in the migration itself, not just in RLS.
revoke all on public.courses, public.profiles, public.exam_intel,
  public.materials, public.votes, public.reports from anon;
grant select, insert, update, delete on public.courses, public.profiles,
  public.exam_intel, public.materials, public.votes, public.reports
  to authenticated;

-- =============================================================================
-- 4. courses — read-only for SIIT users; writes reserved for admins
-- =============================================================================
create policy "courses_select_siit_users"
  on public.courses for select
  to authenticated
  using (public.jwt_is_siit_email());

create policy "courses_write_admin_only"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- 5. profiles — full row readable only by its owner; see profiles_public
--    below for what other users are allowed to see (handle, not real_name).
-- =============================================================================
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and public.jwt_is_siit_email());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Owned by the migration role (postgres), which is exempt from RLS on the
-- underlying table by default — that's what lets this view surface other
-- users' handles despite profiles_select_own restricting the base table to
-- the owning row. Only the columns listed here are ever exposed this way.
create view public.profiles_public
  with (security_invoker = false)
  as
  select id, handle, program, year
  from public.profiles;

revoke all on public.profiles_public from anon, authenticated;
grant select on public.profiles_public to authenticated;

-- =============================================================================
-- 6. exam_intel — read: any SIIT user. Write: only your own rows.
-- =============================================================================
create policy "exam_intel_select_siit_users"
  on public.exam_intel for select
  to authenticated
  using (public.jwt_is_siit_email());

create policy "exam_intel_insert_own"
  on public.exam_intel for insert
  to authenticated
  with check (author_id = auth.uid() and public.jwt_is_siit_email());

create policy "exam_intel_update_own"
  on public.exam_intel for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "exam_intel_delete_own"
  on public.exam_intel for delete
  to authenticated
  using (author_id = auth.uid());

-- =============================================================================
-- 7. materials — same shape as exam_intel.
-- =============================================================================
create policy "materials_select_siit_users"
  on public.materials for select
  to authenticated
  using (public.jwt_is_siit_email());

create policy "materials_insert_own"
  on public.materials for insert
  to authenticated
  with check (author_id = auth.uid() and public.jwt_is_siit_email());

create policy "materials_update_own"
  on public.materials for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "materials_delete_own"
  on public.materials for delete
  to authenticated
  using (author_id = auth.uid());

-- =============================================================================
-- 8. votes — anyone SIIT-gated can read (for aggregate counts); each user
--    only ever writes their own vote row.
-- =============================================================================
create policy "votes_select_siit_users"
  on public.votes for select
  to authenticated
  using (public.jwt_is_siit_email());

create policy "votes_insert_own"
  on public.votes for insert
  to authenticated
  with check (user_id = auth.uid() and public.jwt_is_siit_email());

create policy "votes_update_own"
  on public.votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "votes_delete_own"
  on public.votes for delete
  to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- 9. reports — reporters see their own reports; admins see and resolve all.
-- =============================================================================
create policy "reports_select_own_or_admin"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid() and public.jwt_is_siit_email());

create policy "reports_update_admin_only"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- 10. Storage: a private bucket for material file uploads.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/markdown']
)
on conflict (id) do nothing;

-- Any SIIT user can read any file in the archive — it's shared content, not
-- per-user private storage.
create policy "materials_bucket_select_siit_users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'materials' and public.jwt_is_siit_email());

-- Uploads must land under the uploader's own uid-prefixed path
-- (materials/{auth.uid()}/filename), so ownership is verifiable from the
-- path alone.
create policy "materials_bucket_insert_own_path"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materials'
    and public.jwt_is_siit_email()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "materials_bucket_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'materials' and owner = auth.uid())
  with check (bucket_id = 'materials' and owner = auth.uid());

create policy "materials_bucket_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materials' and owner = auth.uid());
