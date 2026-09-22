-- ============================================================
-- Project Blueprints — "What to create?"
-- Run in the Supabase SQL editor (after 006_notifications_certificates.sql)
-- ============================================================

-- One row per generated blueprint. The whole graph (nodes + edges + phases +
-- approaches) lives in a single jsonb column: it is generated once, read whole,
-- and never queried by its internals — a relational split would buy nothing.
create table if not exists project_blueprints (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  tagline text not null default '',
  -- echo of the inputs so the page can show "generated for: React, junior, 4 weeks"
  inputs jsonb not null default '{}'::jsonb,
  -- { nodes: [...], edges: [...], phases: [...], approaches: [...], stretch: [...] }
  graph jsonb not null default '{}'::jsonb,
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

alter table project_blueprints enable row level security;

drop policy if exists "project_blueprints_own" on project_blueprints;
create policy "project_blueprints_own" on project_blueprints
  for all using (auth.uid() = student_id);

create index if not exists idx_project_blueprints_student_created
  on project_blueprints(student_id, created_at desc);

-- Per-student checkbox state for blueprint nodes. Separate table so ticking a
-- node is a tiny upsert instead of rewriting the whole graph jsonb.
create table if not exists blueprint_node_completions (
  blueprint_id uuid not null references project_blueprints(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  node_key text not null,
  is_completed boolean not null default true,
  completed_at timestamptz not null default now(),
  primary key (blueprint_id, node_key)
);

alter table blueprint_node_completions enable row level security;

drop policy if exists "blueprint_node_completions_own" on blueprint_node_completions;
create policy "blueprint_node_completions_own" on blueprint_node_completions
  for all using (auth.uid() = student_id);
