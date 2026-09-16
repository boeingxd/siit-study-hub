-- =============================================================================
-- Fix a live privilege-escalation hole: profiles_update_own's WITH CHECK
-- constrains which ROW a user may write (auth.uid() = id), never which
-- COLUMN. Combined with the blanket `grant update on public.profiles to
-- authenticated` from 20260818030425, any signed-in SIIT user could
-- PATCH their own row with {"is_admin": true} and self-promote. Same hole
-- exists on insert during onboarding.
--
-- RLS cannot fix this (no OLD in WITH CHECK), so this is privilege grants
-- plus a guard trigger, not a policy change.
-- =============================================================================

-- 1. Column-level grants -------------------------------------------------
-- A bare `revoke update (is_admin) on public.profiles from authenticated`
-- would silently do nothing here: 20260818030425 already issued a
-- TABLE-level `grant update`, and Postgres stores table- and column-level
-- ACLs separately — the column revoke would just emit a WARNING and leave
-- the table-level grant (and thus the hole) in place. Must revoke the
-- table-level grant first, then re-grant only the columns a client may
-- touch.
revoke insert, update on public.profiles from authenticated;

grant insert (id, handle, real_name, program, year) on public.profiles to authenticated;
grant update (handle, real_name, program, year) on public.profiles to authenticated;
-- select stays table-level: useAuth's `select('*')` and is_admin()'s own-row
-- read both depend on it. `id` is intentionally absent from the update grant
-- so a user can't repoint their profile row at another uid either.

-- 2. Guard trigger — defense in depth ------------------------------------
-- The blanket `grant ... to authenticated` line in 20260818030425 is the
-- most copy-pasteable pattern in this repo; any future migration that
-- repeats it would silently reopen the hole with no error. This trigger
-- fails closed regardless of grants.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  -- current_user is the PostgREST caller role here specifically because
  -- this function is INVOKER (the default) — do not make it SECURITY
  -- DEFINER, or current_user becomes the function owner and this never
  -- fires. Written as a NOT IN allow-list of trusted maintenance roles so
  -- a future role is constrained by default, not exempted by default.
  if current_user not in ('postgres', 'supabase_admin', 'service_role') then
    if tg_op = 'INSERT' and new.is_admin then
      raise exception 'is_admin cannot be set by the client.' using errcode = '42501';
    elsif tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
      raise exception 'is_admin cannot be changed by the client.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_privileges_biu
  before insert or update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- 3. is_admin() -> SECURITY DEFINER --------------------------------------
-- All three existing call sites (courses_write_admin_only,
-- reports_select_own_or_admin, reports_update_admin_only) only ever read
-- auth.uid()'s own profile row, which profiles_select_own already
-- permitted — so this widens nothing observable. What it buys: removes an
-- infinite-recursion landmine if is_admin() is ever referenced from a
-- profiles policy, and makes it work unconditionally from storage.objects
-- policy context (needed by the moderation migration that follows this
-- one). search_path is pinned empty per Supabase's linter rule for
-- SECURITY DEFINER functions, so every reference must be fully qualified.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Deliberately not adding is_admin to profiles_public — that would publish
-- a list of moderators to every signed-in student.
