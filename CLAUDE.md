# CLAUDE.md

Project-specific conventions for Claude Code sessions working on this repo.

## Paddle integration

Platform subscription billing goes through Paddle Billing (see
`DEPLOYMENT.md`'s "Payment gateway (Paddle)" section for the full setup).
When writing or modifying Paddle-related code:

- Check current Paddle documentation via the `paddle-docs` MCP server
  before suggesting code, if it's connected in this session — the Paddle
  API and SDKs evolve. If it isn't connected (it wasn't in the session
  this integration was first written in), say so explicitly rather than
  presenting training-data recall as verified, and lean on Paddle's
  publicly documented, stable request/response shapes (Billing API v2)
  rather than anything SDK-specific you can't check.
- Backend is Deno (Supabase Edge Functions, `supabase/functions/`), not
  Node — `npm:` specifiers work (see `paddle-webhook/index.ts`'s
  `npm:@supabase/supabase-js@2` import) but this is not a Node.js project;
  don't assume Node-only tooling or `package.json`-managed deps apply to
  the functions directory.
- All development uses the sandbox environment
  (`VITE_PADDLE_ENVIRONMENT=sandbox`). Sandbox API keys contain `_sdbx`;
  sandbox client-side tokens are prefixed with `test_` — if a value a
  human pastes doesn't match the expected prefix for the environment
  they say they're in, flag it before using it rather than assuming it's
  right.
- Webhook signatures are verified in `supabase/functions/paddle-webhook/index.ts`
  (`isValidSignature`), a hand-rolled HMAC-SHA256 check against Paddle's
  publicly documented `Paddle-Signature` format
  (`ts=<unix_timestamp>;h1=<hex_hmac>` over `${ts}:${rawBody}`), not the
  official `@paddle/paddle-node-sdk`'s `webhooks.unmarshal()` — that
  swap needs the `paddle-docs` MCP server (or an equivalent way to verify
  the SDK's current API) to do safely; don't make it blind.
- For destructive account changes (updating prices, archiving products,
  canceling subscriptions) via a `paddle-sandbox`/`paddle-live` MCP
  server, if connected: ask for explicit confirmation before calling it.
- API keys and webhook secrets live in Supabase Edge Function secrets or
  Vercel env vars — never inline credentials into code. See
  `DEPLOYMENT.md` and `.env.template` for the full list of `VITE_PADDLE_*`
  (client-safe) and `PADDLE_*` (server secret) vars this integration
  needs.

## Platform owner console

The owner-only `/superadmin` console is documented in `DEPLOYMENT.md`
("Platform owner console"). When touching it or anything near it:

- Never add `'superadmin'` (or any platform role) to `UserRole`,
  `memberships.role` or `has_tenant_role()` — the platform owner is a separate
  concept (`platform_admins` allowlist), and `roles.test.ts` asserts an unknown
  role string degrades to trainer.
- Never store platform/owner state in `platform_subscriptions.metadata`: the
  Paddle webhook replaces that object on every event. Manual grants use
  `payment_provider = 'manual'`.
- Cross-tenant access goes only through the `platform_*` SECURITY DEFINER RPCs
  (each starts with `require_platform_admin()`); never add a broad RLS bypass,
  because most client code omits tenant filters and relies on RLS.
- New `public` functions/tables must be explicitly revoked from `anon` and
  `authenticated` (Supabase default privileges grant to them directly), and
  `supabase/tests/platform_admin_console.test.sql` loops over `platform_%`
  functions to catch a miss.

## Custom staff roles

Gym admins can define custom roles (`tenant_roles`, `memberships.custom_role_id`;
`DEPLOYMENT.md` "Team and custom roles"). When touching roles, permissions or any
function/table near them:

- A custom role is a **restriction on a built-in tier** (`employee`/`trainer`),
  never a new tier. Keep `UserRole`, `memberships.role` and `has_tenant_role()`
  at admin/employee/trainer; narrowing is done only by the `RESTRICTIVE` policies
  (`*_perm_*`) and `has_permission()`. Never add a permissive policy that grants
  by custom permission, and never let a custom role hold or imply admin (the
  `memberships_custom_role_guard` trigger clears it).
- `has_permission()` returns true for anyone without a custom role, so built-in
  roles behave exactly as before. A new table that employees can write, or a new
  `SECURITY DEFINER` function that reads/writes finance, shop, attendance, member
  or class data, needs a matching restrictive policy / an explicit
  `has_permission` check, and a case in `supabase/tests/custom_roles.test.sql`.
- Role and team changes go through the admin-only `staff_*` functions; the browser
  has no write privileges on the role tables. The UI (`can()`, `<Can>`,
  `requiredPermission`) only hides things - the database is the guarantee.
- One login belongs to one gym (the app opens the oldest membership), so invites
  refuse an email that already has an account.

## Accessibility and browser tests

`npm run e2e` (see `DEPLOYMENT.md`, "Browser end-to-end and accessibility tests") fails on any axe finding for any screen, so when adding UI:

- Text colours: on light surfaces use `text-gray-500`/`-600` or darker (the palette's 600 shades are AA-safe on white); always pair a text colour with a lighter `dark:` variant when the surface has a `dark:bg-*`. Light-only pages (landing, plans, legal) have no dark variants on purpose.
- Every `<input>`, `<select>` and icon-only `<button>` needs an accessible name (`aria-label`, or a `<label htmlFor>`; `AppleInput`/`AppleSelect`/`AppleTextarea` link theirs automatically). `AppleSelect` must keep forwarding its ref — react-hook-form's `register()` needs it, and without it Add Invoice and Add Expense cannot be saved.
- Tables go in an `overflow-x-auto` wrapper, never `overflow-hidden`, so phones can scroll them; row action buttons need at least 24×24 px of hit area.
- A flow that needs a database function the demo backend does not imitate gets a stand-in in `src/mocks/` (lazy state, no top-level side effects — `scripts/check-dist-no-mock.mjs` guards the production bundle).
- User-facing toast text lives in the `toasts` block of `src/i18n.ts` / `src/i18n.ar.ts`; code with no component (hooks, `src/api`, modals) calls `i18n.t("toasts.…")`. Never hard-code English into `toast.*`.
- Build-only packages (Tailwind and its plugins, PostCSS, Vite) stay in `devDependencies`, so `npm audit --omit=dev` reflects what actually ships; it must stay at 0 critical/high.

## Plan gating

The Starter plan has no analytics; Pro and above do (`src/utils/planFeatures.ts`,
`canUseAnalytics` from `useSubscription()`). When touching it:

- Gate by calling `planIncludesAnalytics()` / reading `canUseAnalytics`, never by
  comparing `plan_tier` strings in a component. An unknown or missing tier is allowed;
  only `starter` is blocked, and `canUseAnalytics` is false while the plan loads.
- The Analytics route is wrapped in `AnalyticsGuard` (upgrade page), and the sidebar
  item and the Analytics tab on Dashboard, Members, Trainers, Billing and Tasks are
  hidden. A new analytics surface needs the same treatment and a case in
  `e2e/plans.spec.ts`.
- This is a UI plan boundary, not a security boundary: the data still sits behind the
  ordinary RLS and `has_permission()` rules.
- In the demo backend, `sessionStorage["mtdrb.demoPlan"]` picks the plan (default
  enterprise); `useDemoPlan()` in `e2e/helpers.ts` sets it for tests.
