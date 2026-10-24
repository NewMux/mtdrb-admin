#!/usr/bin/env bash
# Runs every SQL test in supabase/tests against a throwaway database built from
# the Supabase stand-in (supabase/tests/support/supabase_shim.sql), schema.sql
# and ALL migrations in filename order - the same recipe each test file's header
# describes. Needs a Postgres 16 superuser connection via the usual libpq
# variables (PGHOST, PGPORT, PGUSER, PGPASSWORD), and `psql` on the PATH.
#
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres scripts/run-sql-tests.sh
#
# The database it uses (default: mtdrb_sql_tests) is DROPPED AND RECREATED, so
# never point this at a database you care about. Exits non-zero if any test file
# fails to run or does not end with "ALL PASSED".

set -euo pipefail

cd "$(dirname "$0")/.."

DB="${1:-mtdrb_sql_tests}"
case "$DB" in
  postgres | template0 | template1)
    echo "Refusing to use the '$DB' database." >&2
    exit 2
    ;;
esac

admin() { psql -X -q -v ON_ERROR_STOP=1 -d postgres "$@"; }
inside() { psql -X -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

echo "Building database $DB ..."
admin -c "DROP DATABASE IF EXISTS \"$DB\"" -c "CREATE DATABASE \"$DB\""
inside -f supabase/tests/support/supabase_shim.sql >/dev/null 2>&1
inside -f supabase/schema.sql >/dev/null 2>&1

for migration in $(ls supabase/migrations/*.sql | sort); do
  if ! inside -f "$migration" >/dev/null 2>/tmp/sql-tests-migration.err; then
    echo "MIGRATION FAILED: $migration" >&2
    head -n 8 /tmp/sql-tests-migration.err >&2
    exit 1
  fi
done

failed=0
total=0
for test_file in supabase/tests/*.test.sql; do
  total=$((total + 1))
  if output=$(inside -f "$test_file" 2>&1) && grep -q "ALL PASSED" <<<"$output"; then
    echo "ok   $test_file  $(grep -o 'ALL PASSED: [0-9]* checks' <<<"$output")"
  else
    failed=$((failed + 1))
    echo "FAIL $test_file" >&2
    grep -E "TEST FAILED|ERROR" <<<"$output" | head -n 5 >&2 || true
  fi
done

echo "$((total - failed))/$total SQL test files passed."
[ "$failed" -eq 0 ]
