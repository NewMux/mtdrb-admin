# MTDRB deployment guide

## Release prerequisites

The application contains tenant, member, billing, VAT, and private-document data. Do not expose a new production deployment until the authorization and storage migrations below have been applied to the target Supabase project and the negative security tests have passed.

## Database schema and migrations

**The actual bootstrap path this project's production database was built from —
and the one to follow for any new environment — is `supabase/schema.sql`
followed by every file in `supabase/migrations/`, applied in filename
order.** Numbered files (`001_...` through `007_...`) predate the switch to
timestamped filenames; both naming schemes sort correctly together and the
Supabase CLI (`supabase db push`) or SQL editor will apply them in the right
order either way. Do not hand-pick a subset — treat the migrations directory
as authoritative and run all of it; a list of individually named files here
will drift out of date every time a new migration is added (as the previous
version of this doc did — it referenced `004_`, `008_`, and `009_` files
that no longer exist under those names).

`supabase/complete_schema.sql` and `supabase/complete_schema_v2.sql` are
consolidated alternative schemas, not what the current production project
was actually built from — the live database's applied-migrations history
(`supabase_migrations.schema_migrations`) starts at `supabase/schema.sql`
and includes every migration below it. Don't substitute either
`complete_schema*.sql` file for the real bootstrap path above unless you've
independently verified it produces an equivalent end state; they haven't
been validated against what's actually running in production.

Migrations of particular note (not exhaustive — see the directory for the
full, current list):

- `005_fix_memberships_rls.sql` — closes a tenant-isolation hole where any
  authenticated user could insert their own membership into any tenant.
- `20260814074442_harden_authorization.sql` — replaces metadata-based
  authorization with membership-derived tenant and role checks, restricts
  membership administration, hardens security-definer functions, and
  removes anonymous execution access to sensitive RPCs.
- `20260814074507_secure_financial_storage.sql` — makes receipt and invoice
  buckets private, constrains file types and size, and creates tenant-scoped
  `storage.objects` policies.
- `20260820175040_create_pos_module.sql` — creates the tenant-scoped POS
  catalog, stock ledger, sales, returns, RLS policies, and atomic
  checkout/return RPCs.
- `20260823064606_restrict_platform_subscription_self_service.sql` and
  `20260823085415_restrict_trigger_function_execute.sql` — close a
  self-service write hole that let a client grant itself an active paid
  subscription, and remove an unintended direct-RPC exposure on the trigger
  function that enforces it.

Do not use the loose historical `fix_*.sql` files at the top level of
`supabase/` as a substitute for the ordered migrations directory.

After applying the migrations, verify the effective deployed state in Supabase:

- `memberships`, `tenants`, invoices, expenses, VAT returns, and all feature tables have RLS enabled.
- `anon` has no execute privilege on tenant-derived or financial RPCs.
- `expense-receipts` and `invoice-files` show `public = false`.
- The storage policies only allow paths in the form `receipts/<tenant UUID>/...` or `invoices/<tenant UUID>/...` and validate the membership role.
- A user from tenant A cannot select, insert, update, delete, or export tenant B’s records or files.
- `pos_categories`, `pos_products`, `pos_stock_movements`, `pos_sales`, `pos_sale_items`, `pos_returns`, and `pos_return_items` have RLS enabled, and the POS RPCs reject anonymous callers and users below employee role.

## Environment variables

Hard-required in Vercel Production and/or a local `.env` — `npm run build:deploy`'s
`scripts/check-env.mjs` fails the build if either is missing or malformed,
and the app throws at runtime outside dev if they're absent:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Recommended, with safe built-in fallbacks (`src/config/runtimeConfig.ts`) —
a missing value silently falls back rather than failing the build, so set
these deliberately rather than relying on the defaults for a real launch:

- `VITE_APP_NAME` — the product name shown in the app shell. Falls back to "MTDRB Fitness".
- `VITE_DEFAULT_LANGUAGE` — use `en` or `ar`; the language switcher persists the user’s choice. Falls back to `en`.
- `VITE_DEFAULT_TIMEZONE` — falls back to the browser's timezone.
- `VITE_DEFAULT_CURRENCY` — falls back to `USD`.
- `VITE_DEFAULT_COUNTRY_CODE` — falls back to empty.
- `VITE_DEFAULT_VAT_RATE` — falls back to `0`.
- `VITE_PLATFORM_CURRENCY` — falls back to `VITE_DEFAULT_CURRENCY`, then `USD`.
- `VITE_STARTER_PLAN_NAME`, `VITE_STARTER_PRICE`, `VITE_STARTER_EXTRA_LOCATION_PRICE` — fall back to "Starter", `80`, `20`.
- `VITE_PRO_PLAN_NAME`, `VITE_PRO_PRICE`, `VITE_PRO_EXTRA_LOCATION_PRICE` — fall back to "Pro", `130`, `10`.

Optional:

- `VITE_APP_URL` — the canonical application URL used for authentication redirects. If unset, the app falls back to `window.location.origin`.
- `VITE_FORCE_REAL_CLIENT=true` — required when local development should use a real Supabase project instead of the mock client.
- `VITE_SENTRY_DSN` — enables production error monitoring (Sentry) via `src/services/monitoring.ts`. Unset by default; without it, runtime errors are only logged to the browser console and are otherwise invisible once deployed.

The MTDRB AI assistant, its browser integration, and its Edge Function are not part of this deployment.

## Financial document migration

New receipt and invoice records store an object path rather than a public URL. The UI requests a five-minute signed URL only when a user opens a document. Existing values that use the old Supabase public URL format are converted to their object path by `src/utils/storage.ts`; arbitrary external URLs are rejected. After confirming signed access works, remove any old public bucket access and invalidate old public URLs where your storage policy permits.

## Vercel

The repository’s `vercel.json` uses `npm ci`, `npm run build:deploy`, SPA routing, and security headers including `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS. `build:deploy` runs typecheck and `scripts/check-env.mjs`, which fails fast if the public Supabase URL/key are missing or malformed. Production source maps are disabled in `vite.config.ts`.

Use the actual Production deployment URL (Vercel → project → Domains — the one marked **Production**, not a `-git-<branch>-` preview alias). Confirm that Deployment Protection is not blocking Production if the application is intended to be publicly reachable.

Supabase’s free tier may pause a project after inactivity. If authentication or data requests hang, check whether the project is paused before diagnosing the client.

## Local development and validation

The default `npm run dev` path on `localhost` uses the mock Supabase client and demo data. This is controlled by `src/utils/isLocalhost.ts`. Use `VITE_FORCE_REAL_CLIENT=true` when testing RLS, storage, or database functions locally.

Run the following before deployment:

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --run
npm run test:coverage
npm audit --omit=dev
npm run build:deploy
```

`npm run build:deploy` must be run with the Production values configured in Vercel. A local build without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` is expected to fail with an actionable configuration message; this prevents a blank production artifact from being published.

The release gate should fail on lint warnings, missing coverage, or critical/high production advisories. Any temporary dependency exception must be documented with an owner and expiration date.
