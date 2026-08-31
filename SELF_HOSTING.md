# Self-hosting on Hetzner + Coolify

**Status: partially migrated.** The frontend (this repo) is deployed on
Coolify and live at `mtdrb.net` / `www.mtdrb.net`. The backend is **not**
migrated yet — the live frontend still talks to the original Supabase
Cloud project (`mtdrb-admin`, ref `dewplojbsxyytqixwfkb`,
`https://dewplojbsxyytqixwfkb.supabase.co`). Steps 2-4 below are what's
left: provision self-hosted Supabase via Coolify, migrate the data into
it, and verify it before cutting the frontend over to point at it. Do
**not** skip to Step 5 — that's a live app with paying tenants and real
billing data pointed at the current Supabase Cloud project.

The commands below have the real project ref, DB host, and Storage bucket
names filled in (pulled directly from the live project) so they're
close to copy-paste ready — you still need to supply your own DB password
and the self-hosted instance's connection details once Step 2 exists.

Everything up to and including committing `Dockerfile`/`nginx.conf.template`
to this repo was done in an earlier session. Everything below runs on your
Hetzner box (or wherever you manage DNS/Supabase Cloud) — no tool in this
session can reach either one directly, so treat this as a runbook to
execute yourself (or paste command output back for help debugging).

## What's already confirmed portable

- No Vercel-specific features are used (no serverless functions, KV, Blob) —
  just a static SPA build. `Dockerfile`/`nginx.conf.template` in this repo
  reproduce `vercel.json`'s build command, SPA routing, and exact security
  headers.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are hard-required
  (see `scripts/check-env.mjs`); everything else in `.env.example` has a
  safe fallback.
- Only standard Supabase features are used: Postgres + RLS, Auth (plus one
  custom RPC, `get_lockout_threshold`), private Storage buckets accessed via
  signed URLs, and light Realtime usage in three components. No Edge
  Functions are part of this deployment.

## Step 2 — Provision Hetzner + Coolify (staging)

1. Confirm the server has headroom for Postgres + GoTrue (Auth) +
   PostgREST + Storage-api + Realtime + Kong + the frontend container
   together — 4GB RAM as a floor, more if the box runs anything else.
2. Install Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
   (see Coolify's docs for the current official install command).
3. In Coolify, deploy Supabase via its built-in one-click **Supabase**
   service template. This bundles Postgres, GoTrue, PostgREST, Storage-api,
   Realtime, and Kong. Deploy it under a staging subdomain
   (e.g. `supabase-staging.yourdomain.com`) — do not point production DNS
   at it yet.
4. Deploy this repo as a second Coolify application (Dockerfile-based
   build). In Coolify's **Build Variables** for this app, set:
   - `VITE_SUPABASE_URL` = the staging Supabase instance's URL
   - `VITE_SUPABASE_ANON_KEY` = the staging instance's anon key
   - Any of the optional `VITE_*` vars from `.env.example` you want to
     override
   In the app's regular (runtime) **Environment Variables**, set:
   - `SUPABASE_DOMAIN` = the staging Supabase instance's host (e.g.
     `supabase-staging.yourdomain.com`) — this feeds the CSP `connect-src`
     header in `nginx.conf.template`, so Storage/Auth/Realtime requests
     from the browser aren't blocked.
   Deploy under a staging subdomain too (e.g. `app-staging.yourdomain.com`).

## Step 3 — Migrate data into staging (dry run)

1. Dump the production Supabase Cloud database, including the `auth`
   schema so existing users and password hashes carry over. The project's
   DB host is `db.dewplojbsxyytqixwfkb.supabase.co` — get the password
   from Supabase Dashboard → Project Settings → Database (or your saved
   connection string) and substitute it below rather than pasting it
   anywhere persistent:
   ```bash
   pg_dump "postgresql://postgres:<DB_PASSWORD>@db.dewplojbsxyytqixwfkb.supabase.co:5432/postgres" \
     --schema=public --schema=auth --schema=storage \
     --no-owner --no-privileges \
     -f mtdrb_prod_dump.sql
   ```
2. Restore into the new self-hosted Postgres (the one Coolify's Supabase
   template provisioned):
   ```bash
   psql "$STAGING_SUPABASE_DB_URL" -f mtdrb_prod_dump.sql
   ```
3. Re-apply the migrations per `DEPLOYMENT.md`'s bootstrap path —
   `supabase/schema.sql` followed by every file in `supabase/migrations/`
   in filename order — against the staging database. **Don't assume the
   dump alone reproduces every RLS policy/RPC correctly**; the migrations
   directory is the authoritative source per `DEPLOYMENT.md`, and this step
   is what actually proves the dump + migrations together produce the
   right end state.
4. Migrate Storage bucket contents — the project currently has **four**
   buckets in use, not just receipts/invoices — from Supabase Cloud to the
   self-hosted Storage-api, which is S3-compatible:
   ```bash
   rclone sync supabase-cloud:expense-receipts staging-supabase:expense-receipts
   rclone sync supabase-cloud:gym-logos staging-supabase:gym-logos
   rclone sync supabase-cloud:invoice-files staging-supabase:invoice-files
   rclone sync supabase-cloud:task-attachments staging-supabase:task-attachments
   ```
   (configure both as S3-compatible `rclone` remotes first — Supabase Cloud
   and self-hosted Storage-api both expose an S3-compatible endpoint).
   `gym-logos` is the one public bucket (`public = true`); the other three
   are private. Preserve that distinction on the self-hosted side, or the
   RLS/security release-gate checklist in `DEPLOYMENT.md` will fail on it.
5. **Decide on the `JWT_SECRET` question now, not at cutover**: self-hosted
   GoTrue needs the *same* `JWT_SECRET` the Supabase Cloud project uses for
   existing user sessions/tokens to keep validating after cutover. Two
   options:
   - Copy the production project's JWT secret into the self-hosted GoTrue
     config → existing sessions keep working, no forced re-login.
   - Use a fresh secret → every user is signed out once and has to log
     back in (their password still works, since password hashes came over
     with the `auth` schema dump). Simpler, lower-risk to get wrong, just
     needs to be communicated to users ahead of cutover.

## Step 4 — Verify staging before touching production traffic

1. Run against the staging deployment:
   ```bash
   npm run validate   # lint + typecheck + tests
   ```
2. Manually re-run the release-gate checks `DEPLOYMENT.md` already
   requires for any new environment, against the staging Postgres:
   - RLS enabled on every table (`memberships`, `tenants`, invoices,
     expenses, VAT returns, POS tables, etc.)
   - `anon` has no execute privilege on tenant-derived or financial RPCs
   - `expense-receipts`, `invoice-files`, and `task-attachments` show
     `public = false`; `gym-logos` is the one bucket that's intentionally
     `public = true`
   - Storage policies only allow tenant-scoped paths and validate role
   - A user from tenant A genuinely cannot read/write/export tenant B's
     data
   - POS tables have RLS enabled and POS RPCs reject anonymous/under-role
     callers
3. Set up **scheduled and tested** Postgres backups before going further —
   e.g. nightly `pg_dump` to a Hetzner Storage Box or off-box object
   storage, plus a periodic real restore test (a backup you've never
   restored from is not a verified backup). This is the biggest new
   responsibility you're taking on by leaving a managed database.

## Step 5 — Cutover (not started — backend still on Supabase Cloud)

Only after Step 4 fully checks out. Note the frontend deploy/DNS part of
this step already happened (that's why `mtdrb.net` is live on Coolify
today) — what's left is re-pointing it at the self-hosted backend instead
of Supabase Cloud:

1. Redeploy this repo's Coolify app with **Build Variables** changed to
   point at the real self-hosted Supabase instance (not staging, not
   `dewplojbsxyytqixwfkb.supabase.co`) and the runtime `SUPABASE_DOMAIN`
   env var set to its real host.
2. DNS for `mtdrb.net`/`www.mtdrb.net` already points at the Hetzner box —
   nothing to change there, just the app's own config in step 1.
3. Keep the Supabase Cloud project (`dewplojbsxyytqixwfkb`) alive and
   un-pointed as an immediate rollback path for a defined soak window —
   1-2 weeks is a reasonable default — before decommissioning it.
4. Watch closely during the soak window: existing Sentry wiring
   (`VITE_SENTRY_DSN`) already covers frontend errors; add basic
   uptime/log monitoring for the new Postgres/Coolify stack (Coolify has
   built-in service health monitoring, or wire a simple external uptime
   check against the app and Supabase URLs).

## Step 6 — Ongoing operational responsibilities

None of these exist as a problem yet, while the backend is still on
Supabase Cloud — but they will the moment Step 5 happens, so plan for them
now rather than after cutover:

- Scheduled, periodically **tested** Postgres backups (not just "backups
  exist" — prove a restore works, on a schedule).
- A patching/upgrade cadence for Postgres and the Supabase stack images.
- Basic monitoring/alerting for disk space, CPU, and service health — a
  single Hetzner box has none of Vercel/Supabase Cloud's automatic scaling
  or failover.
