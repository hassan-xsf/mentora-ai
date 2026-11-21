-- Live upgrade for a project that already ran 000-007: migrations 008-016 + a data reset.
-- Paste into Supabase -> SQL Editor and run once. One transaction: any error rolls everything back.
-- Keeps accounts (auth.users, students) and reference data (careers, assessment_questions);
-- deletes all other user data so the app can be re-checked from a clean state.
-- Generated from supabase/migrations/008..016; edit those, not this file.

begin;

-- ======================================================================
-- 008_security_hardening.sql
-- ======================================================================

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


-- ======================================================================
-- 009_assessments.sql
-- ======================================================================

-- ============================================================
-- 009 Saved, explainable career assessments
-- ============================================================

-- The question bank now lives here (it used to be hardcoded in the form) so the
-- server can validate submitted answers against it. `slug` is the stable key the
-- scoring weights in src/lib/assessment/profile.ts are keyed on; the original
-- generic seed rows have no slug and are no longer shown.
alter table assessment_questions add column if not exists slug text unique;
alter table assessment_questions add column if not exists is_core boolean not null default false;

insert into assessment_questions (slug, is_core, position, type, question, options) values
  ('coding_level', true, 0, 'single_choice', 'What is the most complex thing you have personally built with code?',
   '["Nothing yet — I have not written code outside a tutorial", "Small scripts or exercises that solve one problem", "A working app or site I finished on my own", "A multi-part project with a database, users, or an API", "Something used by real people, or work I was paid for"]'),
  ('math_comfort', true, 1, 'single_choice', 'How far did you get with maths, and how did it feel?',
   '["I avoid maths and want a path with as little as possible", "I can handle it when it has a clear practical purpose", "Comfortable with statistics and probability", "Comfortable with calculus and linear algebra", "Maths is a strength — proofs and theory are enjoyable"]'),
  ('energy_source', true, 2, 'multi_choice', 'Which of these tasks would you happily do for a whole day?',
   '["Chasing down why something is broken until it works", "Making an interface look and feel exactly right", "Digging through a messy dataset for the real story", "Designing how parts of a large system fit together", "Automating a boring manual process away", "Talking to users and turning their needs into a plan", "Breaking into something to prove it is not secure", "Explaining a hard concept so others finally get it"]'),
  ('drain_source', true, 3, 'multi_choice', 'Which of these would drain you fastest?',
   '["Long meetings and stakeholder alignment", "Pixel-level visual polish", "Heavy maths and statistics", "Being on call for production incidents", "Reading dense documentation and specifications", "Repetitive, well-defined tasks with no ambiguity", "Presenting and persuading in front of a group"]'),
  ('time_commitment', true, 4, 'single_choice', 'Realistically, how many hours a week can you study?',
   '["Under 5 — I need a slow, steady path", "5-10 hours alongside other commitments", "10-20 hours, this is a serious focus", "20+ hours, I am going at this full time"]'),
  ('horizon', true, 5, 'single_choice', 'When do you need to be job-ready?',
   '["Within 6 months — fastest route to employable", "About a year", "2+ years, I am still studying", "No deadline — depth matters more than speed"]'),
  ('learning_style', true, 6, 'single_choice', 'How do you actually learn best?',
   '["Building projects and looking things up as I hit them", "Structured courses worked through in order", "Reading documentation and books first, then applying", "Video walkthroughs I can follow along with", "Working through problem sets and challenges"]'),
  ('motivation', true, 7, 'single_choice', 'What would make a job feel worth it five years in?',
   '["Strong pay and financial security", "Deep technical mastery and respect for the craft", "Building products that people visibly use", "Autonomy and flexibility over my time", "Work that has a social or scientific impact", "Leading teams and shaping direction"]'),
  ('ambiguity', false, 8, 'scale', 'You are handed a vague problem with no clear right answer. That feels…',
   '["Stressful — I want clear requirements", "Uncomfortable but manageable", "Fine, I will find a direction", "Good — this is where I do my best work", "Ideal — ambiguity is the interesting part"]'),
  ('debug_patience', false, 9, 'single_choice', 'A bug has resisted you for three hours. What is your honest reaction?',
   '["Frustrated — I would want to hand it off", "I push on but it wears me down", "I take a break and come back methodically", "I get more stubborn the longer it takes"]'),
  ('visual_sense', false, 10, 'scale', 'How strong is your eye for visual detail and layout?',
   '["Weak — I cannot tell why something looks off", "Below average", "Average — I notice obvious problems", "Strong — bad spacing bothers me", "Very strong — I redesign things in my head"]'),
  ('people_facing', false, 11, 'scale', 'How much of your week do you want spent with other people?',
   '["Almost none — deep solo focus", "Mostly solo with occasional check-ins", "An even split", "Mostly collaborative", "Constant contact — people are the job"]'),
  ('risk_tolerance', false, 12, 'single_choice', 'Which first job would you take?',
   '["Stable large employer, clear ladder, predictable work", "Established mid-size company with room to move", "Early startup — more chaos, more ownership", "Freelance or contract work I source myself", "Research, academia, or an open-source funded role"]'),
  ('domain_pull', false, 13, 'multi_choice', 'Which of these problem spaces genuinely interests you?',
   '["Health and medicine", "Finance and markets", "Games and entertainment", "Climate and energy", "Education", "Robotics and hardware", "Security and privacy", "Developer tools and infrastructure", "No strong preference — the work matters more"]'),
  ('writing', false, 14, 'scale', 'How do you feel about writing — docs, explanations, proposals?',
   '["I avoid it", "I can do it but would rather not", "Neutral", "I am comfortable and reasonably good at it", "It is one of my strengths"]'),
  ('tools_touched', false, 15, 'multi_choice', 'Which of these have you actually used, even briefly?',
   '["Git and GitHub", "A terminal or command line", "HTML and CSS", "Python", "JavaScript or TypeScript", "SQL or a database", "A spreadsheet for real analysis", "Figma or another design tool", "Cloud services (AWS, GCP, Azure)", "None of these yet"]'),
  ('feedback_loop', false, 16, 'single_choice', 'What kind of progress keeps you going?',
   '["Seeing something visible change immediately", "A test suite going green", "A number improving — speed, accuracy, cost", "Someone telling me the thing helped them", "Finally understanding a concept that was opaque"]'),
  ('credential_path', false, 17, 'single_choice', 'What is your situation with formal credentials?',
   '["In a computing or engineering degree now", "In a degree in a different field", "Degree finished, changing direction", "No degree — self-taught route", "Bootcamp or certificate route"]')
on conflict (slug) do update set
  is_core = excluded.is_core,
  position = excluded.position,
  type = excluded.type,
  question = excluded.question,
  options = excluded.options;

-- One row per completed assessment. Written only by the server action (admin
-- client) after the answers are validated and credits charged, so a refresh of
-- the results page never re-runs the AI or re-charges.
create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  -- [{ question_id, slug, question, answer }]
  answers jsonb not null,
  -- deterministic output of computeProfile(): { scores, evidence, constraints }
  skill_profile jsonb not null,
  -- AI (or fallback) career suggestions
  suggestions jsonb not null,
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

alter table assessments enable row level security;

drop policy if exists "assessments_select_own" on assessments;
create policy "assessments_select_own" on assessments
  for select to authenticated using (auth.uid() = student_id);

create index if not exists idx_assessments_student_created
  on assessments(student_id, created_at desc);


-- ======================================================================
-- 010_ai_evaluation.sql
-- ======================================================================

-- ============================================================
-- AI evaluation: call telemetry + student feedback on AI output
-- Apply after 009. Idempotent.
-- ============================================================

-- One row per AI call (kind = 'call') or per switch to canned content
-- (kind = 'fallback'). Written by the server only (service role); students
-- never read it, so RLS is on with no policies.
create table if not exists ai_events (
  id uuid primary key default uuid_generate_v4(),
  feature text not null check (char_length(feature) <= 64),
  kind text not null check (kind in ('call', 'fallback')),
  ok boolean not null,
  latency_ms integer,
  prompt_chars integer,
  response_chars integer,
  error text check (error is null or char_length(error) <= 500),
  -- telemetry outlives the student: keep the row, drop the link
  student_id uuid references students(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table ai_events enable row level security;

create index if not exists idx_ai_events_feature_created on ai_events(feature, created_at);
create index if not exists idx_ai_events_created on ai_events(created_at);

-- Thumbs up/down on one piece of AI output. target_id is text because targets
-- are different tables (roadmap uuid, chat message uuid, "test:q3", ...).
create table if not exists ai_feedback (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  feature text not null check (char_length(feature) <= 64),
  target_id text not null check (char_length(target_id) <= 200),
  rating smallint not null check (rating in (-1, 1)),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (student_id, feature, target_id)
);

alter table ai_feedback enable row level security;

drop policy if exists "ai_feedback_select_own" on ai_feedback;
create policy "ai_feedback_select_own" on ai_feedback
  for select to authenticated using (auth.uid() = student_id);

create index if not exists idx_ai_feedback_feature_created on ai_feedback(feature, created_at);


-- ======================================================================
-- 011_adaptive_learning.sql
-- ======================================================================

-- ============================================================
-- 011 Adaptive learning + milestone test attempt detail
-- Run after 008_security_hardening.sql. Idempotent.
--
--   * milestone_test_sessions: a fresh question set per attempt. Server-only
--     (holds correct answers and grading rubrics).
--   * milestone_test_attempts gains session_id / practice. Practice attempts
--     (canned fallback questions) are always stored with passed = false so they
--     can never unlock a section or count towards a certificate.
--   * milestone_question_results: per-question grading, readable by the owner
--     after submission.
--   * review_items: spaced-repetition queue of weak topics (nodes).
--   * remedial_plans: cached per-node remedial plan. Server-only (holds the
--     quick-check answers).
-- ============================================================

create table if not exists milestone_test_sessions (
  id uuid primary key default uuid_generate_v4(),
  test_id uuid not null references milestone_tests(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  questions jsonb not null default '[]',
  used_fallback boolean not null default false,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
alter table milestone_test_sessions enable row level security;
revoke all on table milestone_test_sessions from anon, authenticated;
create index if not exists idx_milestone_test_sessions_student_test
  on milestone_test_sessions(student_id, test_id, created_at desc);
-- At most one open (unsubmitted) question set per student per test.
create unique index if not exists uq_milestone_test_sessions_open
  on milestone_test_sessions(student_id, test_id) where submitted_at is null;

alter table milestone_test_attempts
  add column if not exists session_id uuid references milestone_test_sessions(id) on delete set null;
alter table milestone_test_attempts
  add column if not exists practice boolean not null default false;
-- A question set can be submitted once, even under concurrent requests.
create unique index if not exists uq_milestone_test_attempts_session
  on milestone_test_attempts(session_id) where session_id is not null;

create table if not exists milestone_question_results (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references milestone_test_attempts(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  question_id text not null,
  position integer not null default 0,
  node_id uuid references nodes(id) on delete set null,
  type text not null check (type in ('mcq', 'short')),
  question text not null,
  options jsonb,
  student_answer text not null default '',
  correct_answer text,
  is_correct boolean not null default false,
  -- 0..1; MCQ is 0 or 1, short answers can earn partial credit
  score numeric not null default 0 check (score >= 0 and score <= 1),
  feedback text,
  explanation text,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
alter table milestone_question_results enable row level security;
drop policy if exists "milestone_question_results_select_own" on milestone_question_results;
create policy "milestone_question_results_select_own" on milestone_question_results
  for select to authenticated using (auth.uid() = student_id);
create index if not exists idx_milestone_question_results_student
  on milestone_question_results(student_id, created_at desc);

create table if not exists review_items (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  node_id uuid not null references nodes(id) on delete cascade,
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  -- index into the interval ladder 1, 3, 7, 14, 30 days
  stage smallint not null default 0 check (stage between 0 and 4),
  due_date date not null,
  lapses integer not null default 0,
  last_reviewed_at timestamptz,
  source_attempt_id uuid references milestone_test_attempts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, node_id)
);
alter table review_items enable row level security;
drop policy if exists "review_items_select_own" on review_items;
create policy "review_items_select_own" on review_items
  for select to authenticated using (auth.uid() = student_id);
create index if not exists idx_review_items_student_due on review_items(student_id, due_date);

create table if not exists remedial_plans (
  node_id uuid primary key references nodes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  explanation text not null,
  practice_task text not null,
  check_questions jsonb not null default '[]',
  -- canned plan stored so the quick check can be graded; regenerated on next visit
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);
alter table remedial_plans add column if not exists used_fallback boolean not null default false;
alter table remedial_plans enable row level security;
revoke all on table remedial_plans from anon, authenticated;

-- 008 revoked client writes on existing tables; new tables are covered by its
-- default-privileges change, repeated here so this file is safe on its own.
revoke insert, update, delete, truncate on
  milestone_question_results, review_items from anon, authenticated;


-- ======================================================================
-- 012_resources_and_roadmap_rpc.sql
-- ======================================================================

-- 012: verified resource links + atomic roadmap creation.
--
-- resources.link_kind:  'direct' = URL was checked and is live
--                       'search' = URL unverifiable/missing, url holds an honest search link
--                       'none'   = no link (self-authored note)
-- NULL link_kind = row created before verification existed (UI treats it as unverified).

alter table resources
  add column if not exists link_status integer,
  add column if not exists link_kind text check (link_kind in ('direct', 'search', 'none')),
  add column if not exists verified_at timestamptz;

-- Insert one node with its resources and tasks. Internal helper for create_roadmap.
create or replace function public.create_roadmap_node(
  p_roadmap_id uuid,
  p_node jsonb,
  p_position integer,
  p_section_index integer,
  p_parent_id uuid,
  p_branch_side text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into nodes (roadmap_id, title, description, position, section_index, parent_id, branch_side)
  values (
    p_roadmap_id,
    coalesce(nullif(p_node->>'title', ''), 'Untitled topic'),
    coalesce(p_node->>'description', ''),
    p_position,
    p_section_index,
    p_parent_id,
    p_branch_side
  )
  returning id into v_id;

  insert into resources (node_id, title, type, url, content, link_status, link_kind, verified_at)
  select
    v_id,
    r->>'title',
    case when r->>'type' in ('video', 'article', 'note') then r->>'type' else 'article' end,
    nullif(r->>'url', ''),
    null,
    (r->>'link_status')::integer,
    r->>'link_kind',
    (r->>'verified_at')::timestamptz
  from jsonb_array_elements(coalesce(p_node->'resources', '[]'::jsonb)) as r
  where coalesce(r->>'title', '') <> '';

  insert into node_tasks (node_id, title, position)
  select v_id, t->>'title', (ord - 1)::integer
  from jsonb_array_elements(coalesce(p_node->'tasks', '[]'::jsonb)) with ordinality as x(t, ord)
  where coalesce(t->>'title', '') <> '';

  return v_id;
end;
$$;

-- Create a whole roadmap in one transaction: roadmap, trunk + child nodes,
-- resources, tasks, one milestone test per section and the section-0 unlock.
-- Any failure rolls everything back, so a roadmap is never half-written.
-- Payload: {"title","used_fallback","sections":[{"title","nodes":[{"title","description",
--   "resources":[{"title","type","url","link_kind","link_status","verified_at"}],
--   "tasks":[{"title"}],"children":[<node without children>]}]}]}
create or replace function public.create_roadmap(p_student_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roadmap_id uuid;
  v_trunk_id uuid;
  s record;
  n record;
  c record;
begin
  if jsonb_typeof(p_payload->'sections') is distinct from 'array'
     or jsonb_array_length(p_payload->'sections') = 0 then
    raise exception 'create_roadmap: payload has no sections';
  end if;

  insert into roadmaps (student_id, title, completion_percentage, used_fallback)
  values (
    p_student_id,
    coalesce(nullif(p_payload->>'title', ''), 'Learning Roadmap'),
    0,
    coalesce((p_payload->>'used_fallback')::boolean, false)
  )
  returning id into v_roadmap_id;

  for s in
    select value as section, (ordinality - 1)::integer as idx
    from jsonb_array_elements(p_payload->'sections') with ordinality
  loop
    for n in
      select value as node, (ordinality - 1)::integer as idx
      from jsonb_array_elements(coalesce(s.section->'nodes', '[]'::jsonb)) with ordinality
    loop
      v_trunk_id := public.create_roadmap_node(v_roadmap_id, n.node, n.idx, s.idx, null, null);

      -- Children alternate sides so the tree balances.
      for c in
        select value as node, (ordinality - 1)::integer as idx
        from jsonb_array_elements(coalesce(n.node->'children', '[]'::jsonb)) with ordinality
      loop
        perform public.create_roadmap_node(
          v_roadmap_id, c.node, c.idx, s.idx, v_trunk_id,
          case when c.idx % 2 = 0 then 'right' else 'left' end
        );
      end loop;
    end loop;

    insert into milestone_tests (roadmap_id, section_index, type, title, questions)
    values (
      v_roadmap_id,
      s.idx,
      'mcq',
      coalesce(nullif(s.section->>'title', ''), 'Section ' || (s.idx + 1)) || ' Milestone Test',
      '[]'::jsonb
    );
  end loop;

  insert into unlocked_sections (student_id, roadmap_id, section_index)
  values (p_student_id, v_roadmap_id, 0)
  on conflict do nothing;

  return v_roadmap_id;
end;
$$;

revoke execute on function public.create_roadmap_node(uuid, jsonb, integer, integer, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_roadmap_node(uuid, jsonb, integer, integer, uuid, text)
  to service_role;
revoke execute on function public.create_roadmap(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_roadmap(uuid, jsonb) to service_role;


-- ======================================================================
-- 013_internships.sql
-- ======================================================================

-- ============================================================
-- 013 Internships (Pakistan) + student bookmarks
-- Rows are written only by the scraper (service role). Idempotent.
-- ============================================================

create table if not exists internships (
  id               uuid primary key default gen_random_uuid(),
  source           text not null,          -- linkedin | indeed | greenhouse | lever | ...
  source_id        text not null,
  title            text not null,
  company          text not null,
  city             text,                   -- null when remote-only
  is_remote        boolean not null default false,
  is_trainee       boolean not null default false, -- "trainee"/"apprentice" rather than "intern"
  field            text not null default 'other'
                   check (field in ('software','data_ai','design','marketing','finance','hr','engineering','other')),
  stipend          text,
  is_paid          boolean,                -- null = not stated
  description      text,                   -- short snippet, not the full ad
  apply_url        text not null,
  posted_at        timestamptz,
  deadline         date,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  last_checked_at  timestamptz not null default now(),
  missed_runs      integer not null default 0,     -- consecutive runs the listing was not found
  is_active        boolean not null default true,
  dedupe_key       text not null unique,
  unique (source, source_id)
);

create index if not exists internships_active_posted_idx on internships (is_active, posted_at desc nulls last);
create index if not exists internships_field_idx on internships (field) where is_active;

alter table internships enable row level security;
drop policy if exists "internships_select_active" on internships;
create policy "internships_select_active" on internships
  for select to authenticated using (is_active);

create table if not exists saved_internships (
  student_id     uuid not null references students(id) on delete cascade,
  internship_id  uuid not null references internships(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (student_id, internship_id)
);

create index if not exists saved_internships_internship_idx on saved_internships (internship_id);

-- Writes go through a server action with the admin client.
alter table saved_internships enable row level security;
drop policy if exists "saved_internships_select_own" on saved_internships;
create policy "saved_internships_select_own" on saved_internships
  for select to authenticated using (auth.uid() = student_id);


-- ======================================================================
-- 014_code_execution.sql
-- ======================================================================

-- ============================================================
-- 014 Code execution: test-case based grading for coding challenges.
-- Run after 008_security_hardening.sql. Idempotent.
--
--   coding_challenges.examples          visible test cases, safe for the client
--   coding_challenge_secrets            ALL tests + reference solution, server-only
--   coding_submissions                  every Run / Submit attempt (own rows readable)
--   coding_challenges.first_passed_at   set once, atomically, on the first full pass;
--                                       XP is awarded only by the request that sets it
-- status meaning after this migration: 'pending' new, 'submitted' attempted,
-- 'evaluated' passed all tests (badges/progress count these).
-- ============================================================

alter table coding_challenges
  add column if not exists title text,
  add column if not exists examples jsonb not null default '[]'::jsonb,
  add column if not exists validated boolean not null default false,
  add column if not exists first_passed_at timestamptz;

-- Hidden tests + reference solution. No policy and no grants: service role only.
create table if not exists coding_challenge_secrets (
  challenge_id uuid primary key references coding_challenges(id) on delete cascade,
  -- [{ "input": text, "output": text, "hidden": bool }]
  tests jsonb not null,
  reference_solution text,
  created_at timestamptz not null default now()
);

alter table coding_challenge_secrets enable row level security;
revoke all on coding_challenge_secrets from anon, authenticated;

create table if not exists coding_submissions (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references coding_challenges(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  kind text not null check (kind in ('run', 'submit')),
  code text not null,
  passed boolean not null default false,
  tests_passed integer not null default 0,
  tests_total integer not null default 0,
  correctness integer not null default 0 check (correctness between 0 and 100),
  style_score integer check (style_score between 0 and 100),
  feedback text,
  -- client-safe per-test results (hidden tests carry pass/fail + status only)
  results jsonb not null default '[]'::jsonb,
  compile_error text,
  runtime_ms integer,
  memory_kb integer,
  used_fallback boolean not null default false,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

alter table coding_submissions enable row level security;

create index if not exists idx_coding_submissions_challenge
  on coding_submissions(challenge_id, created_at desc);
-- rate limiting counts recent rows per student and kind
create index if not exists idx_coding_submissions_student_kind
  on coding_submissions(student_id, kind, created_at desc);

drop policy if exists "coding_submissions_select_own" on coding_submissions;
create policy "coding_submissions_select_own" on coding_submissions
  for select to authenticated using (auth.uid() = student_id);

revoke insert, update, delete, truncate on coding_submissions from anon, authenticated;


-- ======================================================================
-- 015_leaderboard_and_study_time.sql
-- ======================================================================

-- ============================================================
-- 015 Leaderboard + study time
-- Run after 008_security_hardening.sql (needs xp_events). Idempotent.
-- ============================================================

-- ─── Leaderboard opt-out ────────────────────────────────────
alter table students add column if not exists show_on_leaderboard boolean not null default true;

-- Weekly / monthly / all-time ranking. Never exposes ids or emails: rows carry
-- a privacy-safe name ("Ayesha K." or "Learner #1234") and an is_me flag.
-- Returns the top p_limit visible students plus the viewer's own row, even when
-- the viewer is outside the top or hidden / unranked (then rank is null).
create or replace function public.get_leaderboard(
  p_period text,        -- 'week' | 'month' | 'all'
  p_viewer uuid,
  p_limit integer default 20
)
returns table (
  rank integer,
  display_name text,
  avatar_initial text,
  xp integer,
  streak integer,
  is_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    -- Week starts Monday 00:00 Pakistan time; month on the 1st.
    select case p_period
             when 'week'  then date_trunc('week',  now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi'
             when 'month' then date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi'
           end as since,
           (now() at time zone 'Asia/Karachi')::date as today
  ),
  period_xp as (
    select e.student_id, sum(e.amount)::integer as xp
      from xp_events e, bounds b
     where b.since is not null and e.created_at >= b.since
     group by e.student_id
  ),
  scored as (
    select s.id, s.full_name, s.show_on_leaderboard,
           case when p_period = 'all' then s.xp_total else coalesce(p.xp, 0) end as xp,
           -- a streak whose last active day is before yesterday is already broken
           case when s.last_active_date >= b.today - 1 then s.streak_count else 0 end as streak
      from students s
      cross join bounds b
      left join period_xp p on p.student_id = s.id
  ),
  ranked as (
    select sc.*,
           rank() over (order by sc.xp desc)::integer as rnk,
           row_number() over (order by sc.xp desc, sc.id) as pos
      from scored sc
     where sc.show_on_leaderboard and sc.xp > 0
  ),
  picked as (
    select r.id, r.full_name, r.xp, r.streak, r.rnk
      from ranked r
     where r.pos <= p_limit or r.id = p_viewer
    union all
    select sc.id, sc.full_name, sc.xp, sc.streak, null::integer
      from scored sc
     where sc.id = p_viewer
       and not exists (select 1 from ranked r where r.id = p_viewer)
  ),
  named as (
    select pk.*,
           case
             when coalesce(btrim(pk.full_name), '') = '' then
               'Learner #' || lpad((((hashtext(pk.id::text)::bigint % 10000) + 10000) % 10000)::text, 4, '0')
             when array_length(w.parts, 1) = 1 then left(w.parts[1], 24)
             else left(w.parts[1], 24) || ' ' || upper(left(w.parts[array_length(w.parts, 1)], 1)) || '.'
           end as name
      from picked pk
      cross join lateral (select regexp_split_to_array(btrim(pk.full_name), '\s+') as parts) w
  )
  select n.rnk, n.name, upper(left(n.name, 1)), n.xp, n.streak, n.id = p_viewer
    from named n
   where p_period in ('week', 'month', 'all')
   order by n.rnk nulls last, n.xp desc, n.name
$$;

revoke execute on function public.get_leaderboard(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, uuid, integer) to service_role;

-- ─── Study time ─────────────────────────────────────────────
-- 000 created study_time_events (student_id, node_id, minutes, recorded_at)
-- but nothing wrote to it. It now holds one row per student, Pakistan day and
-- kind (where the time was spent); minutes grows by one per heartbeat and
-- recorded_at is the last heartbeat. Keeps the table at days x kinds rows.
alter table study_time_events add column if not exists kind text;
alter table study_time_events add column if not exists day date;
create unique index if not exists uq_study_time_events_student_day_kind
  on study_time_events(student_id, day, kind);

-- Records one active minute. Returns false (and writes nothing) when the
-- student already got a minute in the last 50 s, so several open tabs or a
-- tampered client can't inflate study time. The advisory lock serialises
-- concurrent heartbeats of the same student.
create or replace function public.record_study_heartbeat(
  p_student_id uuid,
  p_kind text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind is null or p_kind not in ('roadmap', 'practice', 'review', 'test', 'build') then
    raise exception 'record_study_heartbeat: invalid kind';
  end if;

  perform pg_advisory_xact_lock(hashtext('study_heartbeat:' || p_student_id::text));

  if exists (
    select 1 from study_time_events
     where student_id = p_student_id
       and recorded_at > now() - interval '50 seconds'
  ) then
    return false;
  end if;

  insert into study_time_events (student_id, day, kind, minutes, recorded_at)
  values (p_student_id, (now() at time zone 'Asia/Karachi')::date, p_kind, 1, now())
  on conflict (student_id, day, kind)
  do update set minutes = study_time_events.minutes + 1, recorded_at = excluded.recorded_at;
  return true;
end;
$$;

revoke execute on function public.record_study_heartbeat(uuid, text) from public, anon, authenticated;
grant execute on function public.record_study_heartbeat(uuid, text) to service_role;


-- ======================================================================
-- 016_onboarding.sql
-- ======================================================================

-- ============================================================
-- Onboarding tour flag
-- Null = the student has not finished/skipped the first-visit dashboard tour.
-- Written only by server code (admin client) after auth; students can already
-- read their own row via the existing students select policy.
-- ============================================================

alter table students add column if not exists onboarded_at timestamptz;


-- ======================================================================
-- Reset: keep accounts + reference data, delete everything else
-- ======================================================================

truncate table
  public.ai_events, public.ai_feedback, public.assessments, public.badges,
  public.blueprint_node_completions, public.certificates, public.chat_messages,
  public.coding_challenge_secrets, public.coding_challenges, public.coding_submissions,
  public.credit_transactions, public.milestone_question_results, public.milestone_test_attempts,
  public.milestone_test_sessions, public.milestone_tests, public.node_completions,
  public.node_task_completions, public.node_tasks, public.nodes, public.notifications,
  public.progress_records, public.project_blueprints, public.remedial_plans, public.resources,
  public.review_items, public.roadmaps, public.saved_internships, public.study_time_events,
  public.unlocked_sections, public.xp_events;

-- Back to a fresh signup: 1000 credits (logged), no XP/streak, onboarding tour shows again.
update public.students
   set xp_total = 0, streak_count = 0, last_active_date = null, credits = 1000, onboarded_at = null;
insert into public.credit_transactions (student_id, amount, reason, balance_after)
select id, 1000, 'signup_bonus', 1000 from public.students;

-- Record what ran so scripts/db/apply.sh skips these later.
create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now());
alter table public.schema_migrations enable row level security;
insert into public.schema_migrations (name) values
  ('008_security_hardening.sql'),
  ('009_assessments.sql'),
  ('010_ai_evaluation.sql'),
  ('011_adaptive_learning.sql'),
  ('012_resources_and_roadmap_rpc.sql'),
  ('013_internships.sql'),
  ('014_code_execution.sql'),
  ('015_leaderboard_and_study_time.sql'),
  ('016_onboarding.sql')
on conflict do nothing;

commit;
