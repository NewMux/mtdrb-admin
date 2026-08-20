# MTDRB deployment guide

## Release prerequisites

The application contains tenant, member, billing, VAT, and private-document data. Do not expose a new production deployment until the authorization and storage migrations below have been applied to the target Supabase project and the negative security tests have passed.

## Database schema and migrations

Run the following SQL files in the Supabase SQL editor or through the Supabase CLI, in order:

1. `supabase/complete_schema_v2.sql` — the canonical base schema.
2. `supabase/migrations/004_create_platform_subscriptions.sql` — creates the platform entitlement table used by the subscription context and checkout flow.
3. `supabase/migrations/003_create_notifications_table.sql` — creates the notifications table used by the top-bar notification feature; run this if notifications are enabled.
4. `supabase/migrations/006_create_tasks_table.sql` — creates the `tasks` table used by the Tasks page.
5. `supabase/migrations/008_harden_authorization.sql` — replaces metadata-based authorization with membership-derived tenant and role checks, restricts membership administration, hardens security-definer functions, and removes anonymous execution access to sensitive RPCs.
6. `supabase/migrations/009_secure_financial_storage.sql` — makes receipt and invoice buckets private, constrains file types and size, and creates tenant-scoped `storage.objects` policies.
7. `supabase/migrations/20260820180000_create_pos_module.sql` — creates the tenant-scoped POS catalog, stock ledger, sales, returns, RLS policies, and atomic checkout/return RPCs.

Do not use `supabase/complete_schema.sql` (v1) or the loose historical `fix_*.sql` files as a substitute for the ordered deployment. The `008` and `009` migrations are intentionally separate so an existing project can be upgraded without recreating data.

After applying the migrations, verify the effective deployed state in Supabase:

- `memberships`, `tenants`, invoices, expenses, VAT returns, and all feature tables have RLS enabled.
- `anon` has no execute privilege on tenant-derived or financial RPCs.
- `expense-receipts` and `invoice-files` show `public = false`.
- The storage policies only allow paths in the form `receipts/<tenant UUID>/...` or `invoices/<tenant UUID>/...` and validate the membership role.
- A user from tenant A cannot select, insert, update, delete, or export tenant B’s records or files.
- `pos_categories`, `pos_products`, `pos_stock_movements`, `pos_sales`, `pos_sale_items`, `pos_returns`, and `pos_return_items` have RLS enabled, and the POS RPCs reject anonymous callers and users below employee role.

## Environment variables

Required in Vercel Production and/or a local `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME` — the product name shown in the app shell.
- `VITE_DEFAULT_LANGUAGE` — use `en` or `ar`; the language switcher persists the user’s choice.
- `VITE_DEFAULT_TIMEZONE`
- `VITE_DEFAULT_CURRENCY`
- `VITE_DEFAULT_COUNTRY_CODE`
- `VITE_DEFAULT_VAT_RATE`
- `VITE_PLATFORM_CURRENCY`
- `VITE_STARTER_PLAN_NAME`, `VITE_STARTER_PRICE`, `VITE_STARTER_EXTRA_LOCATION_PRICE`
- `VITE_PRO_PLAN_NAME`, `VITE_PRO_PRICE`, `VITE_PRO_EXTRA_LOCATION_PRICE`

Optional:

- `VITE_APP_URL` — the canonical application URL used for authentication redirects. If unset, the app falls back to `window.location.origin`.
- `VITE_FORCE_REAL_CLIENT=true` — required when local development should use a real Supabase project instead of the mock client.

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
