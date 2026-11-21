-- ============================================================
-- 008 Security hardening
-- Run after 007_project_blueprints.sql. Idempotent.
--
-- Model after this migration:
--   * signed-in users may only SELECT their own rows; every write goes through
--     server code using the service-role key (which bypasses RLS);
--   * security definer functions are callable by service_role only;
--   * careers / assessment_questions stay publicly readable;
--   * milestone_tests (holds correct answers) is server-only.
-- ============================================================

-- ─── Credit functions: lock down + validate ─────────────────
create or replace function public.spend_credits(
  p_student_id uuid,
  p_amount integer,
  p_reason text
)
returns integer as $$
declare
  v_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'spend_credits: amount must be positive';
  end if;

  update students
     set credits = credits - p_amount
   where id = p_student_id
     and credits >= p_amount
  returning credits into v_balance;

  if v_balance is null then
    return null;
  end if;

  insert into credit_transactions (student_id, amount, reason, balance_after)
  values (p_student_id, -p_amount, p_reason, v_balance);

  return v_balance;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.add_credits(
  p_student_id uuid,
  p_amount integer,
  p_reason text
)
returns integer as $$
declare
  v_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'add_credits: amount must be positive';
  end if;

  update students
     set credits = credits + p_amount
   where id = p_student_id
  returning credits into v_balance;

  if v_balance is null then
    return null;
  end if;

  insert into credit_transactions (student_id, amount, reason, balance_after)
  values (p_student_id, p_amount, p_reason, v_balance);

  return v_balance;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger function: only ever fired by auth.users inserts, never called directly.
alter function public.handle_new_user() set search_path = public;

revoke execute on function public.spend_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.spend_credits(uuid, integer, text) to service_role;
grant execute on function public.add_credits(uuid, integer, text) to service_role;

-- ─── XP ledger + atomic award ───────────────────────────────
create table if not exists xp_events (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  amount integer not null,
  -- e.g. 'challenge:medium', 'milestone_test', 'backfill'
  reason text not null,
  created_at timestamptz not null default now()
);

alter table xp_events enable row level security;

create index if not exists idx_xp_events_student_created on xp_events(student_id, created_at desc);
create index if not exists idx_xp_events_created on xp_events(created_at);

-- Returns the new xp_total, or null when the student row doesn't exist.
create or replace function public.award_xp(
  p_student_id uuid,
  p_amount integer,
  p_reason text
)
returns integer as $$
declare
  v_total integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'award_xp: amount must be positive';
  end if;

  update students
     set xp_total = xp_total + p_amount
   where id = p_student_id
  returning xp_total into v_total;

  if v_total is null then
    return null;
  end if;

  insert into xp_events (student_id, amount, reason)
  values (p_student_id, p_amount, coalesce(nullif(p_reason, ''), 'unspecified'));

  return v_total;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.award_xp(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.award_xp(uuid, integer, text) to service_role;

-- One row per student so sum(xp_events.amount) = xp_total from day one.
-- Dated at signup so the history doesn't all land in "this week".
insert into xp_events (student_id, amount, reason, created_at)
select s.id, s.xp_total, 'backfill', s.created_at
  from students s
 where s.xp_total > 0
   and not exists (
     select 1 from xp_events e where e.student_id = s.id and e.reason = 'backfill'
   );

-- ─── Badges: one per name per student ───────────────────────
-- Lets the server award with ON CONFLICT DO NOTHING instead of check-then-insert.
delete from badges a
 using badges b
 where a.student_id = b.student_id and a.name = b.name
   and (a.awarded_at, a.id) > (b.awarded_at, b.id);
create unique index if not exists uq_badges_student_name on badges(student_id, name);

-- ─── RLS: drop every write-capable policy ───────────────────
drop policy if exists "students_own" on students;
drop policy if exists "roadmaps_own" on roadmaps;
drop policy if exists "nodes_own_roadmap" on nodes;
drop policy if exists "nodes_insert_own_roadmap" on nodes;
drop policy if exists "nodes_update_own_roadmap" on nodes;
drop policy if exists "nodes_delete_own_roadmap" on nodes;
drop policy if exists "node_completions_own" on node_completions;
drop policy if exists "resources_own_roadmap" on resources;
drop policy if exists "resources_insert_own_roadmap" on resources;
drop policy if exists "node_tasks_own_roadmap" on node_tasks;
drop policy if exists "node_tasks_insert_own_roadmap" on node_tasks;
drop policy if exists "node_task_completions_own" on node_task_completions;
drop policy if exists "milestone_tests_own_roadmap" on milestone_tests;
drop policy if exists "milestone_test_attempts_own" on milestone_test_attempts;
drop policy if exists "unlocked_sections_own" on unlocked_sections;
drop policy if exists "chat_messages_own" on chat_messages;
drop policy if exists "coding_challenges_own" on coding_challenges;
drop policy if exists "badges_own" on badges;
drop policy if exists "progress_records_own" on progress_records;
drop policy if exists "study_time_events_own" on study_time_events;
drop policy if exists "credit_transactions_own" on credit_transactions;
drop policy if exists "notifications_own" on notifications;
drop policy if exists "certificates_own" on certificates;
drop policy if exists "certificates_public_verify" on certificates;
drop policy if exists "project_blueprints_own" on project_blueprints;
drop policy if exists "blueprint_node_completions_own" on blueprint_node_completions;
-- names created below, so re-runs replace them
drop policy if exists "students_select_own" on students;
drop policy if exists "roadmaps_select_own" on roadmaps;
drop policy if exists "nodes_select_own" on nodes;
drop policy if exists "node_completions_select_own" on node_completions;
drop policy if exists "resources_select_own" on resources;
drop policy if exists "node_tasks_select_own" on node_tasks;
drop policy if exists "node_task_completions_select_own" on node_task_completions;
drop policy if exists "milestone_test_attempts_select_own" on milestone_test_attempts;
drop policy if exists "unlocked_sections_select_own" on unlocked_sections;
drop policy if exists "chat_messages_select_own" on chat_messages;
drop policy if exists "coding_challenges_select_own" on coding_challenges;
drop policy if exists "badges_select_own" on badges;
drop policy if exists "progress_records_select_own" on progress_records;
drop policy if exists "study_time_events_select_own" on study_time_events;
drop policy if exists "credit_transactions_select_own" on credit_transactions;
drop policy if exists "notifications_select_own" on notifications;
drop policy if exists "certificates_select_own" on certificates;
drop policy if exists "project_blueprints_select_own" on project_blueprints;
drop policy if exists "blueprint_node_completions_select_own" on blueprint_node_completions;
drop policy if exists "xp_events_select_own" on xp_events;

-- ─── RLS: select-only, own rows ─────────────────────────────
create policy "students_select_own" on students
  for select to authenticated using (auth.uid() = id);
create policy "roadmaps_select_own" on roadmaps
  for select to authenticated using (auth.uid() = student_id);
create policy "nodes_select_own" on nodes
  for select to authenticated using (
    exists (select 1 from roadmaps r where r.id = nodes.roadmap_id and r.student_id = auth.uid())
  );
create policy "resources_select_own" on resources
  for select to authenticated using (
    exists (
      select 1 from nodes n join roadmaps r on r.id = n.roadmap_id
       where n.id = resources.node_id and r.student_id = auth.uid()
    )
  );
create policy "node_tasks_select_own" on node_tasks
  for select to authenticated using (
    exists (
      select 1 from nodes n join roadmaps r on r.id = n.roadmap_id
       where n.id = node_tasks.node_id and r.student_id = auth.uid()
    )
  );
create policy "node_completions_select_own" on node_completions
  for select to authenticated using (auth.uid() = student_id);
create policy "node_task_completions_select_own" on node_task_completions
  for select to authenticated using (auth.uid() = student_id);
-- milestone_tests: intentionally no policy (server-only, holds answers).
create policy "milestone_test_attempts_select_own" on milestone_test_attempts
  for select to authenticated using (auth.uid() = student_id);
create policy "unlocked_sections_select_own" on unlocked_sections
  for select to authenticated using (auth.uid() = student_id);
create policy "chat_messages_select_own" on chat_messages
  for select to authenticated using (auth.uid() = student_id);
create policy "coding_challenges_select_own" on coding_challenges
  for select to authenticated using (auth.uid() = student_id);
create policy "badges_select_own" on badges
  for select to authenticated using (auth.uid() = student_id);
create policy "progress_records_select_own" on progress_records
  for select to authenticated using (auth.uid() = student_id);
create policy "study_time_events_select_own" on study_time_events
  for select to authenticated using (auth.uid() = student_id);
create policy "credit_transactions_select_own" on credit_transactions
  for select to authenticated using (auth.uid() = student_id);
create policy "notifications_select_own" on notifications
  for select to authenticated using (auth.uid() = student_id);
-- Public verification reads through the service role by code, so no public policy.
create policy "certificates_select_own" on certificates
  for select to authenticated using (auth.uid() = student_id);
create policy "project_blueprints_select_own" on project_blueprints
  for select to authenticated using (auth.uid() = student_id);
create policy "blueprint_node_completions_select_own" on blueprint_node_completions
  for select to authenticated using (auth.uid() = student_id);
create policy "xp_events_select_own" on xp_events
  for select to authenticated using (auth.uid() = student_id);

-- ─── Defense in depth: no client write privileges at all ────
-- Even a future permissive policy can't re-open writes without a GRANT.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon, authenticated;
