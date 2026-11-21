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
