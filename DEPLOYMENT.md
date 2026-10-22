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
- `VITE_PLATFORM_CURRENCY` — falls back to `USD`. **Paddle cannot bill in BHD, AED, SAR, KWD, OMR or QAR** (use USD, EUR or GBP). Display only: the amount actually charged is whatever the Paddle price (`VITE_PADDLE_*_PRICE_ID`) is set to, so keep the two in sync - the build refuses to deploy with an unsupported currency or no displayed price.
- `VITE_STARTER_PLAN_NAME`, `VITE_STARTER_PRICE`, `VITE_STARTER_EXTRA_LOCATION_PRICE` — the plan name falls back to "Starter". **Set the three prices explicitly** (the build fails without the plan prices): the code's old defaults were in BHD.
- `VITE_PRO_PLAN_NAME`, `VITE_PRO_PRICE`, `VITE_PRO_EXTRA_LOCATION_PRICE` — likewise, "Pro".

Optional:

- `VITE_APP_URL` — the canonical application URL used for authentication redirects. If unset, the app falls back to `window.location.origin`.
- `VITE_FORCE_REAL_CLIENT=true` — required when local development should use a real Supabase project instead of the mock client.
- `VITE_SENTRY_DSN` — enables production error monitoring (Sentry) via `src/services/monitoring.ts`. Unset by default; without it, runtime errors are only logged to the browser console and are otherwise invisible once deployed.

The MTDRB AI assistant, its browser integration, and its (separate, unrelated)
Edge Function are not part of this deployment.

## Payment gateway (Paddle) and Edge Functions

Platform subscription billing (gym owners paying MTDRB for Starter/Pro
plans) goes through Paddle Billing, a merchant-of-record provider (Paddle
is the seller of record and handles VAT/sales tax compliance itself). This
replaced an earlier CrediMax integration whose CORS configuration could
not be gotten working reliably; see git history for that attempt.

- The checkout itself is entirely client-side: `Subscribe.tsx` loads
  `https://cdn.paddle.com/paddle/v2/paddle.js` and calls
  `Paddle.Checkout.open()` directly with a price ID — no Edge Function
  round-trip to start a purchase, unlike the CrediMax flow this replaced.
- `paddle-webhook` — public; receives Paddle's subscription event
  notifications, verifies Paddle's HMAC webhook signature (`Paddle-Signature`
  header). Only server-side code (this webhook and the `paddle-*` Edge
  Functions, using the service role) and the audited platform-owner RPCs may
  write `platform_subscriptions`; a tenant admin's browser may not (see
  `enforce_platform_subscription_self_service()` in
  `supabase/migrations/20261022120000_cancel_at_and_billing_only_writes.sql`).
  JWT verification disabled (`supabase/config.toml`) — Paddle calls this
  server-to-server, authenticated by its own signature, not a Supabase JWT.

This must be deployed (`supabase functions deploy paddle-webhook`, or via
the Supabase dashboard) whenever this repo is deployed to a new
environment — unlike the rest of this app, it runs server-side, not as
part of the frontend build.

Required **client-side** vars (`VITE_*`, safe to expose — Paddle client
tokens and price IDs are not secrets, the same way a Stripe publishable
key isn't):

- `VITE_PADDLE_CLIENT_TOKEN` — from Paddle's dashboard (Developer Tools →
  Authentication). Use the sandbox token while testing, the live token
  once approved for production.
- `VITE_PADDLE_ENVIRONMENT` — `sandbox` or `production`. Defaults to
  `sandbox` if unset — **set this explicitly for a real production
  deployment**, or checkout will silently run against Paddle's sandbox.
- `VITE_PADDLE_STARTER_PRICE_ID`, `VITE_PADDLE_PRO_PRICE_ID` — the price
  IDs from your Paddle catalog for the Starter and Pro plans.
- `VITE_CHECKOUT_ENABLED` — **the pause switch.** Sign-up and checkout are
  open to everyone by default as soon as the token and both price IDs are set;
  there is no invite-only mode. Set it to exactly `false` (case-insensitive) to
  pause new subscriptions: `/subscribe` then tells customers subscriptions are
  unavailable and the buttons are disabled. Anything else (unset, blank,
  `true`) leaves checkout open. `npm run build:deploy` (also what the Vercel
  and Docker builds run) checks it via `scripts/checkoutConfig.mjs`: it
  **fails** if checkout would be open while the token or either price ID is
  missing (set `VITE_CHECKOUT_ENABLED=false` to ship a deliberately paused
  build), or if the token doesn't match `VITE_PADDLE_ENVIRONMENT` (sandbox
  tokens start with `test_`); it **warns** when pausing, and when a Vercel
  production build still points at the sandbox. Docker builds must pass these
  as build args — the Dockerfile declares them.

Required Edge Function secrets (`supabase secrets set`, **not** `VITE_*`):

- `PADDLE_WEBHOOK_SECRET` — the notification destination's signing secret
  from Paddle's dashboard (Developer Tools → Notifications), used to
  verify `Paddle-Signature`.
- `PADDLE_STARTER_PRICE_ID`, `PADDLE_PRO_PRICE_ID` — the same price IDs as
  the `VITE_*` versions above; the webhook maps an incoming subscription's
  price ID back to a `plan_tier` with these, independently of the client.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase provides these
  automatically to every Edge Function; nothing to set.

**Pricing and currency.** Paddle's API lists the currencies it can bill in
(USD, EUR, GBP, JPY, AUD, CAD, CHF, HKD, SGD, SEK, ARS, BRL, CLP, CNY, COP, CZK,
DKK, HUF, ILS, INR, KRW, MXN, NOK, NZD, PEN, PLN, RUB, THB, TRY, TWD, UAH, VND,
ZAR): **BHD is not one of them**, nor are AED, SAR, KWD, OMR or QAR. USD is
offered in Bahrain, the UAE, Saudi Arabia, Kuwait, Oman and Qatar, so price in
USD (or EUR/GBP) and add per-country overrides in Paddle if you want local
figures. The displayed prices come from `VITE_STARTER_PRICE`, `VITE_PRO_PRICE`,
the two `VITE_*_EXTRA_LOCATION_PRICE` values and `VITE_PLATFORM_CURRENCY` - set
them to exactly what the Paddle prices charge. Paddle prices are immutable in
amount: to change a price, create a new one and update the `*_PRICE_ID` vars.
`scripts/seed-paddle-catalog.mjs` creates the catalog and takes the amounts from
`PADDLE_STARTER_PRICE`, `PADDLE_PRO_PRICE`, `PADDLE_STARTER_EXTRA_PRICE` and
`PADDLE_PRO_EXTRA_PRICE` (no defaults: they are a pricing decision). The
Paddle request shapes this integration uses (cancel `effective_from`, update
`items` + `proration_billing_mode`, `scheduled_change: null` to un-cancel, the
`subscription.*` event names) were checked against Paddle's API reference in
October 2026 and match.

Set up in Paddle's dashboard before this can go live: create the Starter
and Pro products/prices (sandbox first), point a webhook notification
destination at `paddle-webhook`'s deployed URL subscribed to at least
`subscription.created`, `subscription.updated`, `subscription.canceled`,
and confirm no trial period is configured on either price (MTDRB
intentionally has no free trial — see
`supabase/migrations/20260909162346_revoke_self_service_trial_creation.sql`).

The webhook's event field names follow Paddle's published Billing API v2
documentation (`developer.paddle.com/webhooks`), which is public and
stable — but still run at least one real sandbox subscription through the
full flow (checkout → webhook → `platform_subscriptions` row → dashboard
access) before relying on this for real customer traffic.

## Database tests

The database rules are tested in SQL (`supabase/tests/*.test.sql`): row level
security and cross-tenant isolation (`tenant_isolation`), the platform console,
subscription and billing guards (`cancel_subscription`, `past_due_grace`,
`extra_locations`, `self_serve_entitlement`, `account_deletion`,
`multiple_taxes`) and POS money (`pos_currency_decimals`). CI runs them on every
pull request in a throwaway Postgres 16; locally:

```
PGHOST=localhost PGUSER=postgres PGPASSWORD=... scripts/run-sql-tests.sh
```

The script **drops and recreates** its own database (`mtdrb_sql_tests` unless you
pass a name), so never aim it at a database you care about.

These tests prove the **schema and migrations** on a plain Postgres with a small
stand-in for Supabase (`supabase/tests/support/supabase_shim.sql`). They do not
prove your hosted project. The same files could be pointed at a Supabase
**branch** (not production) after applying the migrations there - each runs in
one transaction and rolls back - but that has not been tried: the fixtures insert
into `auth.users` directly, which a real Supabase project may constrain. The
September audit's remaining live checks (a second tenant's real JWT against the
hosted API, storage buckets) still need doing by hand against a branch.

## Point of sale and currency decimals

POS amounts follow the sale's currency: 3 decimals for BHD/KWD/OMR/JOD/TND
(1 BHD = 1000 fils), 0 for JPY and similar, otherwise 2
(`public.currency_decimals()`, the same table as `src/utils/invoiceMath.ts`).
`20261022180000_pos_currency_decimals.sql` widens the POS money columns to
`numeric(12,3)` (existing values are unchanged) and rewrites
`complete_pos_sale()` / `return_pos_sale()` to round per currency, so apply it
**before** deploying the frontend: the new price inputs accept 3 decimals and
the old function would round them away. Sales recorded before it were rounded
to 2 decimals and stay as recorded. `src/utils/posMath.ts` computes the cart
preview the same way the database does; if you change one, change the other
and the shared golden cases in `src/utils/posMath.test.ts` and
`supabase/tests/pos_currency_decimals.test.sql`.

## Extra locations (paid add-on)

Every plan includes **one** location. Each additional branch is a paid
add-on: a second line item on the tenant's Paddle subscription whose quantity
is the number of extra locations (Starter +10 BHD/month, Pro +15 BHD/month by
default). Three pieces make it real, and all three must be in place:

- **Database** (`supabase/migrations/20261022090000_add_extra_locations.sql`):
  `platform_subscriptions.extra_locations`, and a `BEFORE INSERT` trigger on
  `branches` that refuses a branch beyond `1 + extra_locations` with SQLSTATE
  `LC001` (`location_limit_reached`). The limit lives in Postgres, so a direct
  REST insert cannot bypass the UI. `extra_locations` is service-role-only: a
  tenant admin cannot write `platform_subscriptions` at all.
  **Never limited:** gyms with no subscription row (the existing, untracked
  tenants), manual grants from `/superadmin` (`payment_provider = 'manual'`),
  and `enterprise`/`demo` tiers. Existing branches are never removed — a gym
  already over its limit just cannot add more.
- **Edge Function `paddle-manage-locations`**: a tenant admin (checked in
  Postgres from their own JWT) sets the absolute number of extra locations. It
  reads the subscription's current items from Paddle, replaces only the
  add-on item, and PATCHes with `proration_billing_mode`
  `prorated_immediately` when adding (the saved payment method is charged
  the prorated amount straight away) or `prorated_next_billing_period` when
  removing (credit from the next renewal). Deploy it with
  `supabase functions deploy paddle-manage-locations`. Redeploy
  `paddle-webhook` too: it now reads the add-on quantity and stores the
  **total** recurring amount (base + extras) in `amount`.
- **Paddle catalog**: one add-on product/price per plan.
  `PADDLE_API_KEY=... node scripts/seed-paddle-catalog.mjs --addons-only`
  creates them (add `--dry-run` first to inspect the request bodies; use
  `--addons-only` if Starter/Pro already exist so they are not duplicated).

Edge Function secrets (in addition to the Paddle ones above):

- `PADDLE_API_KEY` — a **server-side** Paddle API key (sandbox keys contain
  `_sdbx`). Never put it in a `VITE_*` variable.
- `PADDLE_ENVIRONMENT` — `sandbox` (default) or `production`.
- `PADDLE_STARTER_EXTRA_LOCATION_PRICE_ID`,
  `PADDLE_PRO_EXTRA_LOCATION_PRICE_ID` — the add-ons' **monthly** price IDs.
  Both functions read these; without them the webhook leaves
  `extra_locations` untouched and the manage function answers 503.
- `APP_ALLOWED_ORIGINS` — comma-separated app origins allowed to call the
  function from a browser (falls back to `PLATFORM_ALLOWED_ORIGINS`).

The price shown in the app (`VITE_STARTER_EXTRA_LOCATION_PRICE`,
`VITE_PRO_EXTRA_LOCATION_PRICE`) is display only, like the base plan prices:
what is charged is the Paddle add-on price, so change both together (Paddle
prices are immutable, so a new amount means a new price and a new ID).

**Unverified against a live Paddle account** (the `paddle-docs` MCP server was
not connected when this was written): the `PATCH /subscriptions/{id}` request
body, that an add-on price's `quantity` range is honoured per subscription
item, and the webhook's `items[]` shape for a two-item subscription. Before
real customers: in the sandbox, subscribe, add an extra location in the app,
and confirm (1) Paddle shows two items — plan ×1, extra location ×N — and
charged the prorated amount, (2) `platform_subscriptions.extra_locations` = N
and `amount` = base + N × add-on, (3) a branch beyond the limit is refused by
the database, (4) removing unused extras lowers the quantity at renewal.

**Out-of-order webhooks.** Paddle can deliver events late or out of order. The
webhook stores the `occurred_at` of the newest event it has applied
(`platform_subscriptions.paddle_event_at`, migration
`20261022200000_paddle_event_ordering.sql`) and ignores any older one, so a late
"active" can no longer overwrite a newer cancel or past-due. The check is
repeated inside the `UPDATE`, so two events racing cannot both win. Events with
the same timestamp are applied (a redelivery is harmless); an event with no
`occurred_at` is applied as before.

## Cancelling a subscription

A tenant admin cancels from Settings → Billing. Cancelling is **scheduled in
Paddle for the end of the period already paid for**: the gym keeps full access
until then, is not billed again, and can change its mind ("Keep subscription")
before that date. When the date arrives Paddle sends `subscription.canceled`,
`paddle-webhook` sets the row to `cancelled`, and access ends.

- **Edge Function `paddle-cancel-subscription`** — `{ "action": "cancel" }`
  calls Paddle's `POST /subscriptions/{id}/cancel` with
  `effective_from: "next_billing_period"`; `{ "action": "resume" }` removes the
  scheduled cancellation (`PATCH /subscriptions/{id}` with
  `scheduled_change: null`). It asks Paddle first and records
  `platform_subscriptions.cancel_at` only after Paddle accepts, so the app can
  never show "cancelled" while Paddle keeps billing. The caller must be the
  gym's admin (checked in Postgres from their own JWT); it is idempotent and
  rate-limited. Deploy with `supabase functions deploy paddle-cancel-subscription`
  and redeploy `paddle-webhook`. It uses the same secrets as
  `paddle-manage-locations` (`PADDLE_API_KEY`, `PADDLE_ENVIRONMENT`,
  `APP_ALLOWED_ORIGINS`); nothing new to set.
- **The row's `status` stays `active` while a cancellation is pending**, so
  access continues through `is_tenant_entitled()` / `current_period_end`. The
  webhook reads Paddle's `scheduled_change` into `cancel_at`, and if Paddle
  reports no `next_billed_at` it uses the cancel date (or the billing period's
  end) as `current_period_end`, so an active row never has "no end" (which the
  entitlement check treats as access for ever).
- **Tenants can no longer write `platform_subscriptions` from the browser**
  (`20261022120000_cancel_at_and_billing_only_writes.sql`). The old in-app
  cancel flipped the row's status without telling Paddle: the customer kept
  being billed and the next webhook set the row back to `active`. **Order
  matters:** apply the migration first (Settings now reads `cancel_at`; against
  a database without it that query fails and Settings would show the gym as
  Free), then deploy the two functions, then the frontend. Between the
  migration and the new frontend the old Cancel button shows an error instead
  of cancelling, so keep that gap short.
- **Not self-service:** access granted by the platform owner (`manual`) has
  nothing in Paddle to cancel. Settings hides the cancel option for it; the
  owner revokes it from `/superadmin`.
- **Unverified against a live Paddle account** (the `paddle-docs` MCP server
  was not connected when this was written): the `cancel` and `PATCH` request
  bodies, and the `scheduled_change` / `next_billed_at` fields on the
  subscription entity for a cancel-at-period-end. In the sandbox: subscribe,
  cancel in the app, and confirm (1) Paddle shows the subscription as set to
  cancel on the period end date, (2) `cancel_at` is that date and `status` is
  still `active`, (3) "Keep subscription" clears both, (4) when the date
  passes (use Paddle's sandbox to advance the clock, or cancel with a short
  period) the row becomes `cancelled` and access ends.

## Refunds (14-day money-back guarantee)

The Refund & Cancellation page promises a full refund of the first payment (and
anything added in that period, such as extra locations) if the gym asks within 14
days; later renewals are not refundable. Requests come to `legal@mtdrb.net`
(change the address in `src/pages/Legal.tsx` if you prefer a support mailbox).
The app has no refund button on purpose: refunds are money leaving your account,
so a person does them.

To process one: find the transaction in Paddle (Transactions), confirm it is
inside the 14 days and the email matches the gym, and refund it in full
(Paddle → the transaction → Refund). **A refund does not cancel the
subscription.** Also cancel it immediately in Paddle (Subscriptions → Cancel →
immediately), otherwise it renews. `paddle-webhook` then sets the gym to
`cancelled` and its access ends, as the policy says. Remind the customer to
download their data first (Settings → Data & privacy); if they ask you to
delete it as well, they can delete the gym themselves.

Paddle is the merchant of record and also gives buyers its own refund rights, so
a customer may go to Paddle directly; refunds issued there show up in your Paddle
dashboard, but they do not cancel the subscription either, so check
Subscriptions for refunded-but-active ones from time to time.

## Deleting an account (right to erasure) and exporting data

**Settings → Data & privacy.** A gym admin can (a) download everything in the gym
as one JSON file, (b) download everything held about one member (for that
member's own data request), and (c) permanently delete the gym. Anyone else can
delete just their own account. Both deletions ask the person to type the gym's
exact name (or their email) first.

- **Edge Function `delete-account`** — `{ "scope": "gym" | "me", "confirm": "..." }`.
  The caller is resolved from their JWT (nothing about identity comes from the
  request body). For `gym` it **cancels a live Paddle subscription immediately
  first** (`POST /subscriptions/{id}/cancel`, `effective_from: "immediately"`)
  and deletes nothing if Paddle refuses, so a gym is never billed for something
  that no longer exists; then one database transaction
  (`account_delete_gym()`) deletes the gym and its staff accounts; then the
  uploaded files are removed from the six storage buckets (best effort, reported
  to the caller). Platform-owner accounts are refused. Rate limited to 5
  attempts an hour per person. Deploy with
  `supabase functions deploy delete-account`; it uses the same secrets as
  `paddle-cancel-subscription` (`PADDLE_API_KEY`, `PADDLE_ENVIRONMENT`,
  `APP_ALLOWED_ORIGINS`). Redeploy `paddle-webhook` too: it now ignores the
  cancellation event that arrives after a gym is gone instead of failing and
  being retried for days.
- **Migration `20261024090000_self_service_account_deletion.sql`**:
  `account_delete_gym()` and `account_delete_user()`, callable by the service
  role only. They reuse the owner console's deletion rules (returns are removed
  before sales, a leaving user's records are handed to another admin, a gym's
  only admin must delete the gym instead). The audit row they write holds only
  internal ids and counts - no email, no gym name.
- **What survives a deletion:** the anonymous audit row, payment records held by
  Paddle, and copies in Supabase's backups until they expire. The privacy policy
  says so.
- **A test keeps this honest:** `supabase/tests/account_deletion.test.sql` fails
  if any table with a `tenant_id` column stops cascading from `tenants`, so a
  future table cannot silently survive a gym's deletion. When you add a storage
  bucket, add its `<folder>/<tenant id>/` prefix to
  `supabase/functions/_shared/tenant-storage.ts`.
- **The export reads through row level security**, so it can only ever contain
  the signed-in gym's rows. Tables it cannot read are listed under `errors` in
  the file rather than skipped silently. Internal platform tables are excluded.
- **Unverified against a live Paddle account:** the immediate-cancel request
  body. In the sandbox, subscribe, delete the gym, and confirm Paddle shows the
  subscription cancelled and the gym is gone.

## Failed renewal payments (grace period)

When a renewal charge fails Paddle emails the customer and retries for a while
(subscription status `past_due`). The gym keeps access for **7 days** from the
first failure instead of being locked out at once:

- `paddle-webhook` stores `past_due` and sets
  `platform_subscriptions.grace_until` (now + `PAST_DUE_GRACE_DAYS`, in
  `supabase/functions/_shared/paddle-subscription.ts`) when the subscription
  *first* goes past due. Paddle's later retry events keep the original date, so
  retries cannot extend the grace; a recovered payment returns the row to
  `active` and clears it.
- Access follows `grace_until` in both `is_tenant_entitled()` (database) and
  `isSubscriptionEntitled()` (app): `past_due` with no future grace date means
  no access. When the date passes, or Paddle gives up and sends
  `subscription.canceled`, access ends.
- A banner in the app shell tells the gym to update its payment method before
  the date; Settings shows "Payment failed" and still offers Cancel. Migration:
  `supabase/migrations/20261022150000_past_due_grace.sql` (apply before
  deploying the webhook and frontend).
- Choose the grace length with Paddle's own retry schedule in mind (Dashboard →
  Billing → Retries): if Paddle stops retrying sooner than 7 days it cancels the
  subscription and access ends then.
- The owner console shows a gym inside its grace period as **Payment failed**
  (its own access state, filter and overview tile; migration
  `20261022210000_console_past_due_state.sql`). It counts as having access and as
  billed through Paddle, so "Grant access" refuses to overwrite it while Paddle is
  still retrying the card. After the grace date it shows "No access".
- **Unverified against a live Paddle account:** that a failed renewal arrives as
  `subscription.past_due` / `subscription.updated` with `status: "past_due"`.
  In the sandbox, use a card that fails on renewal and check the row goes
  `past_due` with a `grace_until` 7 days out, then `active` with it cleared when
  a retry succeeds.

## Self-serve sign-up (public launch)

Anyone can now sign up, create a gym and pay without the owner. The path is:

1. `/signup` creates the Supabase Auth user (gym name and full name travel in
   the user's metadata). With **Confirm email** on — required, see below — no
   session exists yet, so the page shows "check your email" with a resend button
   (60 s cooldown).
2. The confirmation link lands on `/welcome` (`src/pages/Welcome.tsx`), which
   calls `ensureGym()` (`src/utils/ensureGym.ts`): it reuses an existing
   membership or creates the gym through `create_tenant_with_membership` as its
   admin, using the gym name from signup. It is safe to repeat (retry, second tab).
   A signed-in user with no gym is sent to `/welcome` from anywhere in the app.
3. `/welcome` continues to `/subscribe`; Paddle checkout opens
   (`VITE_CHECKOUT_ENABLED` — see the Paddle section); the webhook writes the
   subscription row and the gym gets access. The owner is not involved.

**Database rule (migration `20261023090000_new_gyms_need_a_subscription.sql`).**
A gym with no `platform_subscriptions` row used to count as entitled so that gyms
from before the subscription system were not locked out. That would let a
self-serve sign-up skip checkout and write through the API for free, so the
rule is now: no row = entitled **only** for gyms listed in
`legacy_unbilled_tenants`. The migration lists every gym that exists today, has
no subscription row and was created before 2026-09-09 (when the entitlement
check was introduced). Review that list before applying to production:

```sql
select t.id, t.name, t.created_at from public.tenants t
where t.created_at < timestamptz '2026-09-09 00:00:00+00'
  and not exists (select 1 from public.platform_subscriptions s where s.tenant_id = t.id);
```

A gym created since then with no row is treated as unpaid. To grandfather one by
hand, insert its id into `legacy_unbilled_tenants` as the service role; the table
is closed to every browser role. An unpaid new gym is also limited to one
location. (The owner console still lists such a gym as "awaiting activation" and
can still comp it, and *Invite a gym* remains available as a concierge path.)

**Supabase Auth settings the owner must set** (Supabase dashboard — these are not
in the repo and the app cannot check them):

- Authentication → Providers → Email: **Confirm email ON**. Without it anyone
  can register with someone else's address.
- Authentication → URL Configuration: **Site URL** = the production URL, and add
  `<production URL>/welcome` (and the preview URL pattern if you test there) to
  **Redirect URLs**. A confirmation link to an unlisted URL falls back to the
  Site URL and the user lands on the wrong page.
- Authentication → SMTP: configure **custom SMTP**. Supabase's built-in mailer is
  heavily rate-limited (a handful of emails per hour) and meant for testing; at
  launch sign-ups would silently stop receiving their confirmation email.
- **CAPTCHA (Cloudflare Turnstile).** The sign-up, sign-in, forgot-password and
  resend-confirmation forms render a Turnstile challenge and send its token to
  Supabase. Setup, in this order:
  1. Cloudflare dashboard → Turnstile → add a widget for your production domain
     (and `localhost` if you test there). Copy the **site key** and **secret key**.
  2. Set `VITE_TURNSTILE_SITE_KEY` (Vercel env / Docker build arg) and redeploy.
  3. Supabase → Authentication → Attack Protection → enable CAPTCHA, provider
     Turnstile, paste the **secret key**.
  Set **both or neither**. Supabase enforces the check on every one of those
  calls, so enabling it in Supabase without the site key deployed locks everyone
  out of signing in; the site key without Supabase enforcement is harmless but
  protects nothing. The CSP in `vercel.json` / `nginx.conf.template` already
  allows `challenges.cloudflare.com`. A production Vercel build without the key
  prints a warning. Also review Authentication → Rate Limits.
- Authentication → Email Templates → **Confirm signup**: Arabic/English wording
  and your brand; it should say what happens next (choose a plan).

**Not built, and worth knowing before launch**

- No free trial: it was removed on purpose; a new gym must subscribe to use the
  product.
- Account deletion and data export exist (see "Deleting an account").
- A user who signs up and never confirms leaves an unconfirmed Auth user and no
  gym — nothing to clean up on the app side.

## Gym configuration (region, currency, tax)

Each gym configures itself in the setup wizard (first step) and afterwards in
**Settings → Business & tax**: country, currency, timezone, whether it charges
sales tax and under what name/rate/registration number, whether the prices it
enters include tax, and business details printed on receipts. Nothing is
hard-coded to a country: choosing a country only *suggests* a currency, timezone
and the usual standard tax rate (`src/config/regions.ts`; rates are a starting
point, not tax advice, and the owner can change every value).

- **Storage** needs no migration: the existing `gym_settings.currency`,
  `vat_enabled`, `vat_rate` columns plus `metadata.general.{country,timezone}`,
  `metadata.tax`, `metadata.business` and `metadata.setup.configured_at`.
  `src/config/gymConfig.ts` is the only code that reads or writes them, and a
  save merges into the stored metadata so other keys are kept. `vat_rate` is
  `numeric(5,2)`, so rates have at most two decimals (7.5 is fine).
- **Env defaults** (`VITE_DEFAULT_CURRENCY`, `VITE_DEFAULT_TIMEZONE`,
  `VITE_DEFAULT_VAT_RATE`, `VITE_DEFAULT_COUNTRY_CODE`) now only seed a gym that
  has not configured itself. For a global product leave them unset: a new gym is
  then pre-filled from the country its browser timezone points to.
- **Everything else follows the gym's own values**: invoice and expense
  defaults, POS products and receipts, the VAT dashboard, dashboards (day and
  month boundaries use the gym's timezone), and money decimals (BHD/KWD/OMR 3,
  JPY 0, otherwise 2).
- **Several taxes.** A gym can list up to five taxes (a service charge and VAT;
  GST and a provincial tax). Each has a name, a rate, and an optional "charged on
  top of the taxes above" (compound) flag. Everything that multiplies - invoices,
  expenses, POS products and `complete_pos_sale()` - still uses ONE combined rate
  (`gym_settings.vat_rate`, which is `numeric(5,2)`, so the taxes together must
  come to a rate with at most two decimals; the form says so if they don't).
  What is new is a snapshot of how each invoice's and POS sale's tax splits
  between the taxes (`tax_breakdown`, set when the document is created and never
  rewritten when the gym later changes its taxes). Receipts, the invoice summary
  and the VAT dashboard ("Tax collected, by tax") show it. The split is
  `src/utils/taxMath.ts` in the browser and `allocate_tax_breakdown()` in SQL;
  `taxMath.test.ts` and `supabase/tests/multiple_taxes.test.sql` share identical
  golden cases. **Order matters:** apply `20261024120000_multiple_taxes.sql`
  BEFORE deploying the frontend - invoice creation writes `tax_breakdown`, which
  fails against a database without the column.
- **Not covered**: the interface is English/Arabic only; no tax-authority
  e-invoicing (e.g. ZATCA, FTA); expenses record one VAT amount, not a per-tax split. Zakat is an annual levy on
  the business, not a tax added to each sale, so it is deliberately not modelled
  here.
- **Shop (POS) tax in the VAT dashboard**: "VAT collected" (total, monthly and
  per tax) = paid invoices + completed POS sales - tax refunded on POS returns.
  Voided sales and cancelled returns are ignored. A return stores the
  tax it gave back (`pos_returns.vat_total` and a per-tax `tax_breakdown`,
  written by `return_pos_sale()`): each returned line's tax pro rata to the
  quantity, the final return of a line taking exactly what is left, so the
  refunds of a sale add up to the tax it charged; it counts in the month the
  return was made. Apply `20261024230000_pos_return_tax.sql` BEFORE the frontend
  (it adds the columns the dashboard reads and backfills earlier returns with
  the same pro-rata arithmetic). Logic and tests: `src/utils/posVat.ts`,
  `supabase/tests/pos_currency_decimals.test.sql`. This is a working figure for the gym, not a filed
  return - check it with the gym's accountant.

**Setup checklist.** A gym that has not finished the basics sees a "Get your gym
set up" card on its dashboard (configure region and tax, create a plan, add a
member, schedule a class, create an invoice). Each tick is computed from real
data, not stored; the card hides itself when all five are done or when
dismissed (remembered per gym in that browser only).

## Membership plans and expense categories

**Membership plans.** The Plans page (admin) defines plans: name, price and
duration in days. Members are now actually put on them:

- **Add Member** has a "Membership plan" section (shown once the gym has an
  active plan): choose a plan, optionally change the price (a discount, or 0).
- **Renew or change plan** (the refresh icon on a member row, employee and
  above) puts an existing member on a plan. If they are still paid up, the
  default is to continue from the day after their current end date, so no paid
  day is lost; a lapsed member starts today and is reactivated. A suspended
  member keeps their suspension.
- A plan of N days gives exactly N days of access: start to start + N - 1. The
  expiry date is the last day the member may enter (the door readers use it).
  "Today" and every date here are in the gym's own timezone.
- It all runs in `assign_member_plan()` (migration
  `20261025090000_membership_plans.sql`), which sets `members.plan_id`,
  `membership_type` (the plan's name), `expiry_date` and the price paid
  (`metadata.membership_price`). A plan must be active and belong to the gym;
  deleting a plan just leaves its members without one.
- The Plans page's "members on this plan" now comes from `plan_member_counts()`
  (active/trial members whose expiry has not passed); the old stored
  `plans.members_count` column is no longer used.
- **Not included:** assigning a plan does not create an invoice or take a
  payment - record that in Billing as before. **Apply the migration BEFORE
  deploying the frontend** (the dialog calls the new function).

**Expense categories.** Settings > Business & tax has an "Expense categories"
editor: owners add categories of their own (up to 30, 40 characters each) next
to the standard ones (Salaries, Rent, Utilities, ...). They are saved in
`gym_settings.metadata.expenses.categories` (no migration; `src/config/
gymConfig.ts` reads and writes them) and an expense stores the category as
plain text, so reports group by the name. Removing a custom category does not
change expenses that already use it.

**Still fixed by design:** staff roles (admin / employee / trainer - they decide
what the database allows), the payment-method list (accounting and reports
depend on it), and the interface languages (English and Arabic).

## Go-live runbook (sandbox first, then live)

Prices decided: **USD 49 (Starter) / 89 (Pro) a month; extra location 25 / 40**,
monthly only. Paddle's sandbox and live accounts are separate: do every step in
the sandbox, run the smoke test, then repeat steps 3-6 for live.

1. **Database (staging Supabase branch first, never production).** Run the
   grandfathered-gyms query under "Self-serve sign-up", then apply every file in
   `supabase/migrations/` in filename order (`supabase db push`). Run
   `scripts/run-sql-tests.sh` against a throwaway Postgres to be sure the repo
   itself is green.
2. **Auth.** Supabase dashboard: Confirm email on; Site URL and `<url>/welcome`
   redirect; custom SMTP; Turnstile captcha with the secret key (and
   `VITE_TURNSTILE_SITE_KEY` in step 6 - both or neither).
3. **Create the Paddle catalog** (in the sandbox, with the sandbox API key
   - sandbox keys contain `_sdbx`):

   ```
   PADDLE_STARTER_PRICE=49 PADDLE_PRO_PRICE=89 \
   PADDLE_STARTER_EXTRA_PRICE=25 PADDLE_PRO_EXTRA_PRICE=40 \
   PADDLE_API_KEY=pdl_sdbx_... node scripts/seed-paddle-catalog.mjs --dry-run
   ```

   Read the dry run, then run it again without `--dry-run`. It prints the four
   monthly price IDs; running it twice duplicates the products. In the dashboard
   check: no trial period, the add-on prices allow quantity 1-50, and the
   currency is USD. Decide tax-exclusive or tax-inclusive pricing once
   (Paddle → Checkout / tax settings).
4. **Webhook destination** (Paddle → Developer tools → Notifications): URL
   `https://<project-ref>.supabase.co/functions/v1/paddle-webhook`, subscribed to
   `subscription.created`, `.updated`, `.activated`, `.canceled`, `.past_due`,
   `.paused`, `.resumed`. Copy its signing secret. Also create a **client-side
   token** (Developer tools → Authentication) and **approve your app's domain**
   for checkout (Checkout settings).
5. **Edge Function secrets and deploy.**

   ```
   supabase secrets set \
     PADDLE_API_KEY=... PADDLE_ENVIRONMENT=sandbox PADDLE_WEBHOOK_SECRET=... \
     PADDLE_STARTER_PRICE_ID=pri_... PADDLE_PRO_PRICE_ID=pri_... \
     PADDLE_STARTER_EXTRA_LOCATION_PRICE_ID=pri_... PADDLE_PRO_EXTRA_LOCATION_PRICE_ID=pri_... \
     APP_ALLOWED_ORIGINS=https://your-app.example PLATFORM_ALLOWED_ORIGINS=https://your-app.example
   supabase functions deploy paddle-webhook paddle-manage-locations \
     paddle-cancel-subscription delete-account platform-invite-gym
   ```

6. **Frontend env (Vercel).** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_APP_URL`, `VITE_PADDLE_ENVIRONMENT=sandbox`,
   `VITE_PADDLE_CLIENT_TOKEN=test_...`, `VITE_PADDLE_STARTER_PRICE_ID`,
   `VITE_PADDLE_PRO_PRICE_ID`, `VITE_PLATFORM_CURRENCY=USD`,
   `VITE_STARTER_PRICE=49`, `VITE_PRO_PRICE=89`,
   `VITE_STARTER_EXTRA_LOCATION_PRICE=25`, `VITE_PRO_EXTRA_LOCATION_PRICE=40`,
   `VITE_TURNSTILE_SITE_KEY`. Remove any older BHD values and any
   `VITE_DEFAULT_*` region values. The build fails with a clear message if
   something above is missing or the currency is one Paddle can't bill in.
7. **Smoke test** (a real browser, sandbox card `4242 4242 4242 4242`). After each
   step, look at the **Result** column; a mismatch is the bug to chase.

   | Do | Expect |
   |---|---|
   | Sign up with a fresh email | "Check your email" panel, resend works after 60 s |
   | Open the email link | `/welcome` creates the gym, lands on `/subscribe` |
   | Subscribe to Starter | Paddle overlay shows USD 49 (plus tax per your setting); after paying, `platform_subscriptions` has `active`, `starter`, `amount 49`, `currency USD`, and the dashboard opens |
   | Wizard step 1 | Country suggests currency, timezone and tax; finishing saves them |
   | Branches → add an extra location | Paddle subscription shows two items (plan x1, extra x1); `extra_locations = 1`; a second branch can now be created |
   | Settings → Billing → Cancel | Paddle shows it set to cancel at period end; access continues; "Keep subscription" clears it |
   | Pay with a failing card (`4000 0000 0000 0341`) at renewal / dashboard "retry" | Status `past_due`, banner with a 7-day grace, access continues |
   | Another browser: second gym, try to read gym 1's ids through the API | Nothing returned (RLS) |
   | Settings → Data & privacy → delete the gym | Subscription cancelled in Paddle, gym and files gone, sign-in lands on the landing page |

   The sandbox can also advance time (Paddle → simulate) to test a renewal and
   the end of a cancelled period.
8. **Go live.** In Paddle's live account repeat steps 3-5 with the live API key
   (`PADDLE_ENVIRONMENT=production`), a live client token (`live_...`), the
   live webhook secret and the live price IDs; in Vercel set
   `VITE_PADDLE_ENVIRONMENT=production` and the live token and price IDs. Make one
   real purchase with your own card, refund it in Paddle, and cancel it.
   Remove the sandbox values from production environments.

## Worldwide launch checklist

Things the code cannot do for you, in the order I would do them.

1. **Database first, then functions, then the frontend.** Apply every migration
   in filename order (the last two are `20261024090000_self_service_account_deletion`
   and `20261024120000_multiple_taxes`); deploy `delete-account` and redeploy
   `paddle-webhook`; only then deploy the frontend. The new frontend writes
   `invoices.tax_breakdown` and reads `pos_sales.tax_breakdown`, which fail
   against a database without them.
2. **Prices in more than one currency.** The app prices the platform in
   `VITE_PLATFORM_CURRENCY` (currently BHD). Whether Paddle accepts BHD for your
   products is **unconfirmed**. Paddle supports a limited list of currencies and
   shows customers a local price when you add per-country prices to a price
   object. Before launch: check Paddle's supported-currency list in the
   dashboard, create prices in USD (and EUR/GBP if you want them), and complete a
   sandbox purchase from a non-Gulf country. If BHD is not supported, change the
   price IDs and `VITE_PLATFORM_CURRENCY`/`VITE_STARTER_PRICE`/`VITE_PRO_PRICE`
   (the plan cards read them) - no code change is needed. The extra-location
   add-on has its own price IDs and the same question.
3. **Taxes on your own subscription.** Paddle is the merchant of record: it
   calculates and remits VAT/sales tax on what gyms pay you. Confirm in the
   dashboard that tax is enabled for the countries you sell to and whether your
   prices are tax-inclusive or exclusive.
4. **Legal review.** The Terms, Privacy and Refund pages are drafts a lawyer has
   not reviewed. In particular: the governing-law clause names the laws and
   courts of the Kingdom of Bahrain (the contracting company is Bahraini; have a
   lawyer confirm the wording, the company's legal name and address, and whether
   Bahrain's Personal Data Protection Law (Law No. 30 of 2018) needs a
   registration or notification from you as a processor); the privacy page names the processors the code actually uses (Supabase, Vercel,
   Paddle, Cloudflare Turnstile, optional Sentry) and describes the controller /
   processor split and the retention behaviour described above; sign data
   processing agreements with each provider; decide whether you need an EU/UK
   representative. If you add Google Tag Manager or any analytics, add a cookie
   consent banner first: today the app stores only session, language/theme and a
   session-only UTM record, and pushes events to a `dataLayer` that nothing reads.
5. **Where the data lives.** Choose the Supabase project region deliberately
   (EU gyms may expect EU hosting); it cannot be moved later without a migration.
   Use a paid Supabase plan: the free tier pauses after inactivity and has no
   point-in-time recovery. Turn on backups/PITR and test a restore once.
6. **Email and abuse.** Custom SMTP, Confirm email, redirect URLs and the
   Turnstile captcha, as described under "Self-serve sign-up".
7. **Support and status.** A monitored `support@` / `legal@mtdrb.net` mailbox
   (the legal pages publish `legal@mtdrb.net`), a place to report problems, and a
   status page. Set `VITE_SENTRY_DSN` so you hear about errors before customers do.
8. **Languages.** The interface is English and Arabic only. Adding a language
   means translating the `translation` block in `src/i18n.ts` (about 5,000
   strings), registering it in `LanguageSwitcher`, and checking dates and
   numbers; a missing key shows its raw key name. Gym owners elsewhere can use
   the English interface; their members' data is entered by them and is not
   translated.
9. **Per-country invoicing rules.** Some countries require specific invoice
   formats or e-invoicing (Saudi ZATCA, UAE FTA, India GST e-invoice). The app
   records tax correctly and prints the gym's tax number on POS receipts, but it
   does not generate authority-compliant e-invoices.

## Door and reader integration (entry / exit hardware)

Gyms use very different hardware, so the app does not talk to any one brand.
It exposes a vendor-neutral layer; anything that can send an HTTP request (a
controller's webhook/HTTP push, a small bridge box, a script) can plug in, and
a tablet at the desk works with no integration at all.

**Deploy order:** apply `supabase/migrations/20261024150000_access_control.sql`
*before* the frontend, then `supabase functions deploy attendance-ingest`
(`verify_jwt = false` is already set in `supabase/config.toml`; the function
authenticates with the device key instead).

**Setting up a reader (gym admin):** Attendance → Readers → add a device, pick
its direction (entry / exit / auto), then "Create key". The key
(`mtdrb_dev_…`) is shown **once**; only its SHA-256 is stored. Rotating a key
invalidates the old one; revoking stops the reader immediately. The panel
shows a ready-to-paste `curl` example:

```
POST https://<project>.supabase.co/functions/v1/attendance-ingest
x-device-key: mtdrb_dev_…
{"credential_type":"qr|badge|vendor_user_id","credential":"…","external_event_id":"<unique per scan>","occurred_at":"<ISO time, optional>"}
→ {"allowed":true|false,"reason":"…","duplicate":false,"direction":"check_in","member":{"name":"…","expiry_date":"…"}}
```

The device should open the door only when `allowed` is `true`.

**Credentials (Attendance → Member credentials):** a printable QR
(`MTDRB-` + 20 hex, shown once), an RFID/NFC card or fob UID, or the member's
user id inside a terminal (`vendor_user_id`). Card UIDs and QR tokens are stored
hashed; no biometric templates are ever stored — fingerprint/face terminals keep
those on the device and send only their own user id.

**Rules the server enforces:**
- Allowed only if the member status is active or trial **and** the expiry date
  is not past, evaluated in the gym's own timezone (Gym settings).
- Entry readers always record a check-in, exit readers a check-out; `auto`
  alternates (check-in, then check-out; a new check-in after 16 h).
- Idempotent on `external_event_id`; a second tap within 5 s on the same reader
  is recorded as `duplicate`, not a second visit.
- Refused taps are logged as `rejected` with a reason (and don't count in
  attendance metrics). An unknown credential is denied and **not** stored.
- Device scans do not check the gym's own subscription entitlement; the desk
  kiosk (`/dashboard/attendance/kiosk`, any keyboard-style USB/Bluetooth
  scanner or card reader works) does.
- Rate-limited and size-limited at the function (429 / 413).

**Not built:** vendor-specific adapters (ZKTeco ADMS push, Hikvision ISAPI,
Suprema, etc.) — they need a real device to test against; camera-based QR
scanning in the kiosk; blocking entry for unpaid invoices.

## Platform owner console (`/superadmin`)

The owner-only console for seeing every gym and activating / comping /
revoking access. It is **authorised in Postgres, not in the UI**: every
`platform_*` RPC (`supabase/migrations/20261019090000_create_platform_admin_console.sql`)
requires an allowlist row in `platform_admins` **and** a live MFA (aal2)
session with a verified TOTP factor. It shows account-level data only (gym
name, admin emails, access state, usage counts) — never member records.

**One-time setup**

1. Apply the migration with `supabase db push` so the recorded version matches
   the filename. First compare the live trigger function with the repo:
   `select pg_get_functiondef('public.enforce_platform_subscription_self_service'::regproc);`
   against `20260909162346_revoke_self_service_trial_creation.sql` — the
   migration replaces it (adding one early return for the audited RPCs).
2. Supabase → Authentication → Multi-Factor: make sure **TOTP** is enabled.
3. Create the owner login in Supabase → Authentication → Users → *Add user*
   (auto-confirm). Do **not** use `/signup`: that creates a gym. A dedicated
   owner account with no gym is cleanest; if the owner also runs a gym, either
   comp that gym from the console or bookmark `/superadmin`.
4. Allowlist it (SQL editor):
   ```sql
   insert into public.platform_admins (user_id, note)
   select id, 'owner' from auth.users where email = '<owner-email>';
   ```
5. Sign in at `/login`; you land on the console and are asked to enrol an
   authenticator app. **Enrol a second device, or store the secret shown under
   the QR code somewhere safe.**
6. Run the checks in `supabase/POST_DEPLOYMENT_CHECKLIST.md` ("Platform owner
   console").

**Gym and user controls** (`supabase/migrations/20261021150000_platform_admin_gym_and_user_controls.sql`)

Apply this after the console migration above (same way: `supabase db push`, or
paste it in the SQL editor and then record it in the migrations history). It
adds, on a gym's page in the console:

- **Suspend / unsuspend a gym.** Everyone who belongs *only* to that gym is
  banned and signed out; people who also belong to another gym are not touched,
  and unsuspending lifts only the bans the suspension placed. Limit: a ban
  stops sign-in and refresh at once, but an access token already issued stays
  valid until it expires (Supabase default: 1 hour).
- **Delete a gym.** Permanent; you type the gym's exact name. Optionally also
  deletes the accounts of people who belong only to that gym. Refused while a
  Paddle subscription is live (cancel it in Paddle first) and for any gym that
  contains a platform admin. **Files in Storage (receipts, invoice files,
  logos) are not removed.**
- **Ban / unban, reset MFA, change role, delete a user.** Deleting needs the
  user's email typed, and hands their POS records, tasks and stock movements to
  the gym's longest-standing *other* admin (those columns would otherwise block
  the delete). It refuses to delete a gym's only admin (promote someone first,
  or delete the gym), and to demote a gym's last admin.

Rules the database enforces (not just the UI): every action needs a reason of
3 to 500 characters and is written to the append-only audit log; nobody can act
on their own account or on a platform admin; role changes only accept
`admin`, `employee` or `trainer`. These controls show account-level data only;
the audit log records counts and account emails, never member records.

Check it landed with the "Gym and user controls" queries in
`supabase/POST_DEPLOYMENT_CHECKLIST.md`, and run
`supabase/tests/platform_admin_controls.test.sql` on a Supabase branch or a
local stack before applying it to production.

**Create a gym and invite its admin** (`supabase/migrations/20261021170000_platform_admin_provision_gym.sql` + the `platform-invite-gym` Edge Function)

*Gyms → Invite a gym* creates a gym, emails its admin an invitation, and gives
the gym free (complimentary) access for the plan and length you choose (14 days
to 1 year; "no expiry" stays on the gym's own *Grant access* dialog). The
invited person clicks the link, sets a password on the existing
`/reset-password` page, and lands in their gym.

How it is built, and why: the invitation email can only be sent with the Auth
admin API, so a small Edge Function sends it. Everything that matters is
decided in Postgres: the function first checks the caller is a fully verified
platform admin (allowlist + MFA), and then calls `platform_provision_gym` *with
the caller's own token*, so the audit log shows who did it. That function
refuses any account that is not a pending, never-signed-in invitation, so it can
never be pointed at someone's existing account. If provisioning fails, the
function deletes the account the invitation created, so a failure leaves nothing
behind.

One-time setup:

1. Apply `20261021170000_platform_admin_provision_gym.sql` (after the two earlier
   console migrations).
2. Deploy the function: `supabase functions deploy platform-invite-gym`
   (`supabase/config.toml` already sets `verify_jwt = false`; the function verifies
   the caller itself, because the browser's CORS preflight carries no token).
3. Set its two secrets (`SUPABASE_*` ones are provided automatically):
   ```
   supabase secrets set PLATFORM_APP_URL=https://<your app domain>
   supabase secrets set PLATFORM_ALLOWED_ORIGINS=https://<your app domain>
   ```
   `PLATFORM_ALLOWED_ORIGINS` is a comma-separated list; add
   `http://localhost:3000` only for local testing against a real project.
4. Supabase → Authentication → URL Configuration: add
   `https://<your app domain>/reset-password` to **Redirect URLs**. If it is missing,
   the invitation link lands on the Site URL instead and the person cannot set a
   password.
5. Supabase → Authentication → Email Templates → **Invite user**: replace the
   default wording (it says "create a user") with your own. The gym's name is
   available as `{{ .Data.gym_name }}`. Supabase's built-in email sender is limited
   to a handful of messages per hour; configure custom SMTP before inviting more
   than a few gyms.

Behaviour to know: an email that already has an account is refused with a clear
message (nothing is created); the function allows 10 invitations per owner per
hour; an invited person who never accepts leaves an unconfirmed account and a
gym, which you can delete from the gym's page. The set-password page still
says "reset password" for an invited admin.

**Operations**

- Add/remove admins in SQL (`insert into` / `delete from public.platform_admins`).
  Removal takes effect on the next request.
- Lost authenticator: `delete from auth.mfa_factors where user_id = '<uuid>';`
  then sign in and enrol again.
- Every grant/revoke/note is written to `platform_audit_log` (append-only) with
  the actor, reason and before/after. Refused attempts roll back and leave no row.
- Consider a shorter JWT expiry (Auth settings) — the live-session check makes
  sign-out effective immediately, but a stolen token otherwise lives until expiry.
- Break-glass: the SQL editor / service role can still write
  `platform_subscriptions` directly, as before.

**How manual access interacts with Paddle**

A grant writes `platform_subscriptions` with `payment_provider = 'manual'`,
`amount = 0`. Gyms billed through Paddle (active/trialing) are read-only in the
console — change or cancel those in Paddle. If a gym *ever* had a Paddle
subscription, cancel it in Paddle before granting: the webhook upserts on every
event, so a late or retried event can overwrite a manual grant (and a real new
Paddle subscription replaces it, by design). Superadmin state is deliberately
never stored in `platform_subscriptions.metadata`, which the webhook overwrites.
Grants use `payment_provider = 'manual'`; only `pro`/`enterprise` unlock Pro
features, and "no expiry" is entitled forever until revoked.

**Tests**: `supabase/tests/` holds a Supabase shim and a SQL suite that runs on a
plain Postgres 16 (see the header of `platform_admin_console.test.sql`).

**Where are the gyms? ("Gyms by country")** The Overview page has a
"Gyms by country" table (gyms, paid, trial and members per country), served by
`platform_gyms_by_country()` (`20261024180000_platform_gyms_by_country.sql`;
apply it before the frontend). A gym's country is the one it picked in its own
setup; gyms that haven't chosen one yet are listed as "Not set yet". It counts
gyms, not visitors — for paying customers' billing countries use the Paddle
dashboard, and for site visitors Vercel Analytics.

The Gyms list also shows each gym's country and has a country filter
(`?country=BH`, or `?country=none` for gyms that haven't chosen one); the
country names in the Overview table link to it. That needs
`20261024210000_gyms_list_country_filter.sql`, which replaces
`platform_list_tenants` with a version that has one extra optional argument —
apply it before the frontend.

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
