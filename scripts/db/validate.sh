#!/usr/bin/env bash
# Apply every migration, in order, to a throwaway database in a local Docker
# Postgres, and fail on the first error. Safe to run concurrently: each run
# gets its own database inside the shared container.
# Usage: bash scripts/db/validate.sh            (keeps nothing)
#        KEEP=1 bash scripts/db/validate.sh     (prints the db name, keeps it for manual psql tests)
set -euo pipefail
cd "$(dirname "$0")/../.."
C=mentora-pg
if ! docker ps --format '{{.Names}}' | grep -qx "$C"; then
  docker rm -f "$C" >/dev/null 2>&1 || true
  docker run -d --name "$C" -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16 >/dev/null
  for i in $(seq 1 30); do docker exec "$C" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
  sleep 2
fi
DB="v_$(date +%s)_$RANDOM"
docker exec "$C" psql -U postgres -qc "create database $DB" >/dev/null
run() { docker exec -i "$C" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q -X "$@"; }
run < scripts/db/supabase-stub.sql >/dev/null
FILES="supabase/migrations/000_full_setup.sql supabase/migrations/001_add_fallback_flags.sql"
for f in $(ls supabase/migrations/*.sql | sort); do
  n=$(basename "$f" | cut -c1-3)
  [ "$n" -ge 4 ] 2>/dev/null && FILES="$FILES $f"
done
for f in $FILES; do
  echo "applying $f"
  run < "$f" >/dev/null || { echo "FAILED: $f (db $DB kept for inspection)"; exit 1; }
done
echo "OK: all migrations applied cleanly (db $DB)"
run < scripts/db/policy-check.sql >/dev/null 2>&1 && echo "OK: RLS policy checks passed" || { echo "FAILED: policy-check (re-run with KEEP=1 and see scripts/db/policy-check.sql)"; exit 1; }
if [ "${KEEP:-0}" = "1" ]; then
  echo "kept: docker exec -it $C psql -U postgres -d $DB"
else
  docker exec "$C" psql -U postgres -qc "drop database $DB" >/dev/null
fi
