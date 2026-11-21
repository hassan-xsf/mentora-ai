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
