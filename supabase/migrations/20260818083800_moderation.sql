-- =============================================================================
-- Moderation: soft-delete takedowns, a report queue admins can act on, and
-- storage cleanup for removed files. Depends on 20260818083700's
-- SECURITY DEFINER is_admin() (used from storage.objects policy context
-- below, which the old INVOKER version could not reach reliably).
-- =============================================================================

-- 1. Soft-delete columns --------------------------------------------------
-- Soft delete, not hard delete: reports.target_id has no FK (it is
-- polymorphic across exam_intel/materials, so it can't have one), so a
-- hard delete would strand a report pointing at nothing — the queue could
-- never render what was reported or justify a past decision. Soft delete
-- also keeps materials.file_path alive, which is the only pointer to the
-- uploaded blob.
alter table public.exam_intel
  add column removed_at timestamptz,
  add column removed_by uuid references public.profiles (id),
  add column removed_note text;

alter table public.materials
  add column removed_at timestamptz,
  add column removed_by uuid references public.profiles (id),
  add column removed_note text;

create index exam_intel_live_idx on public.exam_intel (course_id) where removed_at is null;
create index materials_live_idx on public.materials (course_id) where removed_at is null;

-- 2. Select policies — removed rows stay visible to their author (so the
-- app can render a tombstone instead of the content silently vanishing)
-- and to admins (so the queue can show what was taken down).
-- (select public.is_admin()) is wrapped in a scalar subquery per
-- Supabase's documented RLS performance pattern — it evaluates once as an
-- InitPlan instead of once per row, which matters now that is_admin() is
-- SECURITY DEFINER (a real table read).
alter policy "exam_intel_select_siit_users" on public.exam_intel
  using (
    public.jwt_is_siit_email()
    and (removed_at is null or author_id = auth.uid() or (select public.is_admin()))
  );

alter policy "materials_select_siit_users" on public.materials
  using (
    public.jwt_is_siit_email()
    and (removed_at is null or author_id = auth.uid() or (select public.is_admin()))
  );

-- 3. Close the hole soft-delete just opened -------------------------------
-- Without this, the existing author-update/delete policies would let an
-- author flip their own removed_at back to null and un-remove content a
-- moderator just took down. USING reads the OLD row, so a removed row is
-- invisible to the author's update entirely; WITH CHECK reads the NEW row,
-- so the author also can't forge a moderator action by setting removed_at
-- themselves. DELETE is blocked on removed rows too, so a takedown can't
-- be followed by the author destroying the evidence.
alter policy "exam_intel_update_own" on public.exam_intel
  using (author_id = auth.uid() and removed_at is null)
  with check (author_id = auth.uid() and removed_at is null);

alter policy "exam_intel_delete_own" on public.exam_intel
  using (author_id = auth.uid() and removed_at is null);

alter policy "materials_update_own" on public.materials
  using (author_id = auth.uid() and removed_at is null)
  with check (author_id = auth.uid() and removed_at is null);

alter policy "materials_delete_own" on public.materials
  using (author_id = auth.uid() and removed_at is null);

-- 4. The only thing that may write removed_at/removed_by/removed_note ----
-- Deliberately no admin UPDATE or DELETE policy on exam_intel/materials:
-- admins can hide student work, never rewrite or destroy it. This RPC is
-- the sole path, so that boundary is provable in one place. Uses a static
-- if/else instead of dynamic SQL — p_target_type never reaches the SQL
-- parser, so there is no injection surface despite being a text param.
create or replace function public.moderate_set_removed(
  p_target_type text,
  p_target_id uuid,
  p_removed boolean,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Not authorised.' using errcode = '42501';
  end if;
  if p_target_type not in ('exam_intel', 'materials') then
    raise exception 'Unknown target type.' using errcode = '22023';
  end if;

  if p_target_type = 'exam_intel' then
    update public.exam_intel
       set removed_at = case when p_removed then now() end,
           removed_by = case when p_removed then v_actor end,
           removed_note = case when p_removed then p_note end
     where id = p_target_id;
  else
    update public.materials
       set removed_at = case when p_removed then now() end,
           removed_by = case when p_removed then v_actor end,
           removed_note = case when p_removed then p_note end
     where id = p_target_id;
  end if;

  if not found then
    raise exception 'Content not found.' using errcode = 'P0002';
  end if;

  if p_removed then
    update public.reports
       set resolved = true
     where target_type = p_target_type
       and target_id = p_target_id
       and not resolved;
  end if;
end;
$$;

revoke execute on function public.moderate_set_removed(text, uuid, boolean, text) from public;
grant execute on function public.moderate_set_removed(text, uuid, boolean, text) to authenticated;

-- 5. Reports: audit trail for resolutions, dedupe ------------------------
alter table public.reports
  add column resolved_at timestamptz,
  add column resolved_by uuid references public.profiles (id);

-- Stamped server-side so the client (which only ever sends
-- {resolved: true}) cannot forge who resolved a report or when. Fires
-- correctly whether the UPDATE comes from the admin queue's direct
-- "Dismiss" write or indirectly from inside moderate_set_removed's own
-- UPDATE on reports — triggers run regardless of the caller, and
-- auth.uid() still reads the request JWT either way.
create or replace function public.stamp_report_resolution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.resolved and not old.resolved then
    new.resolved_at := now();
    new.resolved_by := auth.uid();
  elsif not new.resolved then
    new.resolved_at := null;
    new.resolved_by := null;
  end if;
  return new;
end;
$$;

create trigger stamp_report_resolution_bu
  before update on public.reports
  for each row execute function public.stamp_report_resolution();

-- Dedupe existing rows before the unique constraint (safe even with no
-- production data yet — cheap insurance), then prevent future duplicates.
delete from public.reports r
 using public.reports keep
 where r.reporter_id = keep.reporter_id
   and r.target_type = keep.target_type
   and r.target_id = keep.target_id
   and r.created_at > keep.created_at;

alter table public.reports
  add constraint reports_one_per_reporter unique (reporter_id, target_type, target_id);

-- 6. The admin queue --------------------------------------------------------
-- target_id has no FK (polymorphic across two tables), so PostgREST
-- embedding can't join reports to content — a view beats two round-trips
-- per row and degrades correctly (left join -> null content -> "deleted
-- by its author") if content is ever hard-deleted out from under a report.
--
-- security_invoker = true is the single most important token in this
-- migration. profiles_public (20260818030425) deliberately uses
-- security_invoker = false to surface other users' handles past
-- profiles_select_own. Copying that pattern here would run this view as
-- postgres, bypass RLS on reports entirely, and let every SIIT student
-- read every report in the system including who reported whom. With
-- invoker = true, the existing reports_select_own_or_admin policy applies
-- automatically: admins see everything, a student sees only their own
-- reports, anon sees nothing. The joins to exam_intel/materials also run
-- under caller RLS, which is exactly why step 2 above added
-- "or (select public.is_admin())" to those select policies — without it
-- an admin could see the report but not the removed content it's about.
create view public.moderation_queue
  with (security_invoker = true)
  as
  select
    r.id as report_id,
    r.target_type,
    r.target_id,
    r.reason,
    r.resolved,
    r.resolved_at,
    r.created_at as reported_at,
    rp.handle as reporter_handle,
    co.code as course_code,
    coalesce(initcap(e.exam_type) || ' · ' || e.semester, m.title) as content_title,
    coalesce(e.advice, m.body_md) as content_excerpt,
    coalesce(e.author_id, m.author_id) as content_author_id,
    coalesce(e.removed_at, m.removed_at) as content_removed_at,
    m.file_path
  from public.reports r
  left join public.exam_intel e on r.target_type = 'exam_intel' and e.id = r.target_id
  left join public.materials m on r.target_type = 'materials' and m.id = r.target_id
  left join public.courses co on co.id = coalesce(e.course_id, m.course_id)
  left join public.profiles_public rp on rp.id = r.reporter_id;

revoke all on public.moderation_queue from anon, authenticated;
grant select on public.moderation_queue to authenticated;

-- No DELETE policy on reports — they're a permanent record; the queue is
-- filtered by resolved, never emptied.

-- 7. Storage: let an admin actually remove a reported file -----------------
-- Without this the takedown is incomplete: materials_bucket_select_siit_users
-- grants read on the WHOLE bucket to any SIIT user, so soft-deleting the
-- materials row hides the path from new viewers but anyone who already
-- opened the item still knows the path and can keep minting signed URLs
-- against it indefinitely.
create policy "materials_bucket_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materials' and (select public.is_admin()));

-- Pre-existing inconsistency: materials_bucket_delete_own keyed off
-- `owner = auth.uid()` while the insert policy keys off the path prefix.
-- `owner` is nullable, so an author's own delete could fail for no visible
-- reason. Align it to the same invariant the insert policy already
-- enforces.
alter policy "materials_bucket_delete_own" on storage.objects
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- Manual, one-time step (do NOT run as part of this migration — see plan
-- Step 3 / README for why): promote the first admin once they've signed
-- in and completed onboarding.
--
-- update public.profiles p set is_admin = true
--   from auth.users u where u.id = p.id and u.email = '<your-siit-email>';
-- =============================================================================
