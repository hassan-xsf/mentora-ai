-- ============================================================
-- Notifications + Certificates
-- Run in the Supabase SQL editor (after 005_credits.sql)
-- ============================================================

-- ─── Notifications ───────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  -- 'certificate' | 'milestone' | 'badge' | 'credits' | 'system'
  type text not null default 'system',
  title text not null,
  body text not null default '',
  -- in-app link the notification points at, e.g. /certificates/<id>
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
drop policy if exists "notifications_own" on notifications;
create policy "notifications_own" on notifications
  for all using (auth.uid() = student_id);

create index if not exists idx_notifications_student_created
  on notifications(student_id, created_at desc);

-- ─── Certificates ────────────────────────────────────────────
-- Issued once per (student, roadmap) when the roadmap hits 100%.
create table if not exists certificates (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  -- short human-typeable code used by /verify/<code>
  code text not null unique,
  title text not null,
  -- 'Beginner' | 'Intermediate' | 'Advanced'
  level text not null default 'Beginner',
  recipient_name text not null,
  issued_at timestamptz not null default now(),
  unique(student_id, roadmap_id)
);

alter table certificates enable row level security;

-- Owner can do anything with their own certificates.
drop policy if exists "certificates_own" on certificates;
create policy "certificates_own" on certificates
  for all using (auth.uid() = student_id);

-- Verification is the whole point: anyone holding a certificate may check it.
-- Read-only, and the row carries no private data beyond the printed name.
drop policy if exists "certificates_public_verify" on certificates;
create policy "certificates_public_verify" on certificates
  for select using (true);

create index if not exists idx_certificates_student_issued
  on certificates(student_id, issued_at desc);
