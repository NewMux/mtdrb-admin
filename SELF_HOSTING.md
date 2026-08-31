# Self-hosting on Hetzner + Coolify

**Status: this migration is complete — production runs on Hetzner +
Coolify.** This doc started as the pre-migration runbook off Vercel +
Supabase Cloud; Steps 2-5 below are kept as a record of the path that was
followed (staging first, verify, then cut over) and as a reference for
repeating any of it later — e.g. disaster recovery, or standing up a second
environment. If you're setting up a *new* environment rather than
operating the existing one, follow Steps 2-4 as written, substituting your
own domains/values.

Step 6 (ongoing operational responsibilities) is the live, actionable part
of this doc now — that's what running your own Postgres/Supabase stack
instead of a managed one requires going forward.

Everything up to and including committing `Dockerfile`/`nginx.conf.template`
to this repo was done in-session. Everything below ran on the Hetzner box
(or wherever DNS/Supabase Cloud was managed) during the actual migration.

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
   schema so existing users and password hashes carry over:
   ```bash
   pg_dump "$PROD_SUPABASE_DB_URL" \
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
4. Migrate Storage bucket contents (`expense-receipts`, `invoice-files`,
   and any others in use) from Supabase Cloud to the self-hosted
   Storage-api, which is S3-compatible:
   ```bash
   rclone sync supabase-cloud:expense-receipts staging-supabase:expense-receipts
   rclone sync supabase-cloud:invoice-files staging-supabase:invoice-files
   ```
   (configure both as S3-compatible `rclone` remotes first — Supabase Cloud
   and self-hosted Storage-api both expose an S3-compatible endpoint).
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
   - `expense-receipts` and `invoice-files` (and any other buckets) show
     `public = false`
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

## Step 5 — Cutover (done)

1. Deploy this repo's Coolify app again (or promote the staging one),
   this time with **Build Variables** pointed at the real self-hosted
   Supabase instance (not staging) and the runtime `SUPABASE_DOMAIN` env
   var set to its real host.
2. Switch your domain's DNS to the Hetzner-hosted frontend.
3. Keep the Vercel deployment and Supabase Cloud project alive
   (un-pointed) as an immediate rollback path for a defined soak window —
   1-2 weeks is a reasonable default — before decommissioning either.
   <!-- TODO: record whether Vercel/Supabase Cloud are still live as
   rollback, and when the soak window closes/closed. -->
4. Watch closely during the soak window: existing Sentry wiring
   (`VITE_SENTRY_DSN`) already covers frontend errors; add basic
   uptime/log monitoring for the new Postgres/Coolify stack (Coolify has
   built-in service health monitoring, or wire a simple external uptime
   check against the app and Supabase URLs).

**JWT_SECRET decision made:** <!-- TODO: record which of the two Step 3.5
options was taken — copied the Supabase Cloud project's secret (existing
sessions kept working), or rotated to a fresh one (users were signed out
once). -->

## Step 6 — Ongoing operational responsibilities

None of these existed as your problem while on Vercel/Supabase Cloud —
they do now. This is the live checklist for operating the deployment:

- Scheduled, periodically **tested** Postgres backups (not just "backups
  exist" — prove a restore works, on a schedule).
  <!-- TODO: confirm this is actually set up (schedule + last successful
  restore test), not just planned. -->
- A patching/upgrade cadence for Postgres and the Supabase stack images.
- Basic monitoring/alerting for disk space, CPU, and service health — a
  single Hetzner box has none of Vercel/Supabase Cloud's automatic scaling
  or failover.
