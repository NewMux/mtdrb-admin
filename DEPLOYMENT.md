# Deployment

## Database schema

Run these two files in the Supabase SQL editor, in order:

1. `supabase/complete_schema_v2.sql` — the canonical schema. Safe to re-run any time; it drops and recreates every policy/function itself and uses `CREATE TABLE IF NOT EXISTS`, so it won't touch existing data.
2. `supabase/migrations/006_create_tasks_table.sql` — creates the `tasks` table (general staff-ops tasks used by the Tasks page). This is **not** included in `complete_schema_v2.sql` and must be run separately, or the Tasks feature will come up empty.

Don't use `supabase/complete_schema.sql` (v1, no version suffix) or the other loose `fix_*.sql` files in `supabase/` — they're superseded by `complete_schema_v2.sql`.

## Environment variables

Required in Vercel (Production environment) and/or a local `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`VITE_APP_URL` is optional — if unset, the app falls back to `window.location.origin` for auth redirect links, which is correct for most setups.

## Vercel

- Use the actual **Production** deployment URL (Vercel → your project → Domains — the one marked "Production", not a `-git-<branch>-` preview alias).
- Check Settings → Deployment Protection isn't blocking public access to Production if this is meant to be a public-facing app.
- Supabase's free tier auto-pauses a project after ~1 week of no activity. A paused project makes every request hang instead of failing fast. If the app seems to hang on load/signup/login, check whether the Supabase project needs resuming.

## Local development

`npm run dev` on `localhost` automatically uses a mock Supabase client (`src/mocks/mockSupabaseClient.ts`) seeded with demo data (`src/mocks/demoData.ts`) — no real credentials needed. This is controlled by `src/utils/isLocalhost.ts`. Set `VITE_FORCE_REAL_CLIENT=true` to use the real backend locally instead.
