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
