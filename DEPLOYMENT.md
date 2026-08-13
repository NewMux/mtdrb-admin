# MTDRB deployment guide

## Release prerequisites

The application contains tenant, member, billing, VAT, and private-document data. Do not expose a new production deployment until the authorization and storage migrations below have been applied to the target Supabase project and the negative security tests have passed.

Before rollout, rotate any Gemini key that was ever stored in `VITE_GEMINI_API_KEY` or shipped in a previous client bundle. Removing the variable from Vercel does not invalidate a key that has already been exposed.

## Database schema and migrations

Run the following SQL files in the Supabase SQL editor or through the Supabase CLI, in order:

1. `supabase/complete_schema_v2.sql` — the canonical base schema.
2. `supabase/migrations/004_create_platform_subscriptions.sql` — creates the platform entitlement table used by the subscription context and checkout flow.
3. `supabase/migrations/003_create_notifications_table.sql` — creates the notifications table used by the top-bar notification feature; run this if notifications are enabled.
4. `supabase/migrations/006_create_tasks_table.sql` — creates the `tasks` table used by the Tasks page.
5. `supabase/migrations/008_harden_authorization.sql` — replaces metadata-based authorization with membership-derived tenant and role checks, restricts membership administration, hardens security-definer functions, and removes anonymous execution access to sensitive RPCs.
6. `supabase/migrations/009_secure_financial_storage.sql` — makes receipt and invoice buckets private, constrains file types and size, and creates tenant-scoped `storage.objects` policies.

Do not use `supabase/complete_schema.sql` (v1) or the loose historical `fix_*.sql` files as a substitute for the ordered deployment. The `008` and `009` migrations are intentionally separate so an existing project can be upgraded without recreating data.

After applying the migrations, verify the effective deployed state in Supabase:

- `memberships`, `tenants`, invoices, expenses, VAT returns, and all feature tables have RLS enabled.
- `anon` has no execute privilege on tenant-derived or financial RPCs.
- `expense-receipts` and `invoice-files` show `public = false`.
- The storage policies only allow paths in the form `receipts/<tenant UUID>/...` or `invoices/<tenant UUID>/...` and validate the membership role.
- A user from tenant A cannot select, insert, update, delete, or export tenant B’s records or files.

## Gemini Edge Function

AI calls no longer go directly from the browser to Google. Deploy the function from the repository root:

```bash
supabase functions deploy gemini-chat
supabase secrets set GEMINI_API_KEY="<rotated-provider-key>" ALLOWED_ORIGINS="https://<production-domain>"
```

For local development with a real Supabase project, include the local origin in `ALLOWED_ORIGINS`:

```bash
supabase secrets set ALLOWED_ORIGINS="https://<production-domain>,http://localhost:3000"
```

The function authenticates the Supabase bearer token, resolves the caller’s membership from the database, validates message length and count, allowlists the model, and returns generic provider errors. Do not add `GEMINI_API_KEY` to Vercel, `VITE_*` variables, Git, or any browser-visible configuration. Supabase platform variables such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the function runtime token are provided by the Edge Function runtime.

## Environment variables

Required in Vercel Production and/or a local `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `VITE_APP_URL` — the canonical application URL used for authentication redirects. If unset, the app falls back to `window.location.origin`.
- `VITE_FORCE_REAL_CLIENT=true` — required when local development should use a real Supabase project instead of the mock client.

Do not set `VITE_GEMINI_API_KEY`. The key belongs only in Supabase Edge Function secrets.

## Financial document migration

New receipt and invoice records store an object path rather than a public URL. The UI requests a five-minute signed URL only when a user opens a document. Existing values that use the old Supabase public URL format are converted to their object path by `src/utils/storage.ts`; arbitrary external URLs are rejected. After confirming signed access works, remove any old public bucket access and invalidate old public URLs where your storage policy permits.

## Vercel

The repository’s `vercel.json` uses `npm ci`, SPA routing, and security headers including `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS. Production source maps are disabled in `vite.config.ts`.

Use the actual Production deployment URL (Vercel → project → Domains — the one marked **Production**, not a `-git-<branch>-` preview alias). Confirm that Deployment Protection is not blocking Production if the application is intended to be publicly reachable.

Supabase’s free tier may pause a project after inactivity. If authentication or data requests hang, check whether the project is paused before diagnosing the client.

## Local development and validation

The default `npm run dev` path on `localhost` uses the mock Supabase client and demo data. This is controlled by `src/utils/isLocalhost.ts`. The AI Edge Function requires a real Supabase session, so use `VITE_FORCE_REAL_CLIENT=true` when testing AI, RLS, storage, or database functions locally.

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

The release gate should fail on lint warnings, missing coverage, or critical/high production advisories. Any temporary dependency exception must be documented with an owner and expiration date.
