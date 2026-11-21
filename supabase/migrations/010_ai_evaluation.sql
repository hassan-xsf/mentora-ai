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
