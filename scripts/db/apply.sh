#!/usr/bin/env bash
# Apply pending migrations to the REAL Supabase database (008+ by default; FRESH=1 for an empty one).
# Needs DATABASE_URL in .env.local: Supabase dashboard > Project Settings >
# Database > Connection string (URI, session pooler). Tracks applied files in
# public.schema_migrations so re-running is safe.
set -euo pipefail
cd "$(dirname "$0")/../.."
DATABASE_URL="${DATABASE_URL:-$(grep -E '^DATABASE_URL=' .env.local | cut -d= -f2-)}"
[ -n "$DATABASE_URL" ] || { echo "DATABASE_URL not set"; exit 1; }
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -qc "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now()); alter table public.schema_migrations enable row level security;"
# FRESH=1: empty database -> 000, 001_add_fallback_flags, then 004+ (same order as validate.sh).
# Default: an existing project that already ran 000-007 -> 008+ only.
if [ "${FRESH:-0}" = "1" ]; then MIN=4; FILES="supabase/migrations/000_full_setup.sql supabase/migrations/001_add_fallback_flags.sql"; else MIN=8; FILES=""; fi
for f in $(ls supabase/migrations/*.sql | sort); do
  n=$(basename "$f" | cut -c1-3)
  [ "$n" -ge "$MIN" ] 2>/dev/null && FILES="$FILES $f"
done
for f in $FILES; do
  name=$(basename "$f")
  done=$(psql "$DATABASE_URL" -tAc "select 1 from public.schema_migrations where name = '$name'")
  [ "$done" = "1" ] && { echo "skip $name"; continue; }
  echo "applying $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -1 -f "$f"
  psql "$DATABASE_URL" -qc "insert into public.schema_migrations(name) values ('$name')"
done
echo "done"
