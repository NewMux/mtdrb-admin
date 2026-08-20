# Launch findings

## Runtime validation

- The repository is a Vite + React + TypeScript SPA with Supabase auth/data and a Vercel configuration.
- `npm ci` completed successfully.
- `npm run typecheck` passed.
- `npm run lint` passed with zero warnings.
- `npm test -- --run` passed: 3 test files, 31 tests.
- `npm audit --omit=dev` reported 0 vulnerabilities.
- `npm run build:deploy` passed.
- The headless browser smoke test rendered the landing page and confirmed visible copy and CTA links to `/signup`.
- The connected browser initially received Vite's blocked-host page because `server.allowedHosts` did not include the proxied preview host.

## Confirmed fix

- Updated `vite.config.ts` to import `defineConfig` explicitly and allow only localhost/loopback plus the `.manus.computer` preview suffix, preserving host validation for arbitrary hostnames.

## Backend and conversion findings

- The production Supabase project `mtdrb-admin` is active and healthy.
- The required feature and security migrations are applied, including platform subscriptions, authorization hardening, private financial storage, launch hardening, notifications, and attendance.
- Supabase security advisories still report the expected authenticated execution of tenant-scoped `SECURITY DEFINER` RPCs and disabled leaked-password protection. The repository migration intentionally grants these RPCs to authenticated users, while their function bodies derive `auth.uid()` or require tenant roles; this remains a configuration item to review before declaring a clean security score.
- The current subscription page does not connect to a payment processor. Clicking `Start Free Trial` directly upserts `platform_subscriptions` with `status: active` and `metadata.method: trial_checkout`, so it is a trial/entitlement shortcut rather than a real paid checkout. It must not be marketed as payment processing until a provider and server-side webhook flow are configured.
- The connected browser's extracted markdown is blank on the SPA routes even though the headless DOM renders the landing page, so route behavior should be validated with the local headless smoke test and production deployment checks.
- The Vercel account currently lists only an unrelated `tailor-shop-erp` project; the selected repository does not yet have a matching Vercel project in that account.
- A production build can still fail at runtime if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured in the hosting environment because the client intentionally throws when those values are missing outside development.

## Remaining verification

- Verify Signup, Login, Subscribe, Supabase production environment variables, ordered security migrations, and the live Vercel project before launch.
- Select a real payment provider or explicitly launch as a free-trial / demo acquisition funnel first.

## Production preview smoke test

- The production build was rebuilt with the real Supabase URL and publishable anon key injected only into the local build process.
- The production preview rendered the landing page with the expected navigation, feature sections, pricing cards, and Start Free Trial CTA.
- Clicking the primary CTA navigated to `/signup` and rendered the complete signup form with gym name, full name, email, password, terms checkbox, legal links, and Create account button.
- Route-level code splitting reduced the main JavaScript bundle from approximately 3.0 MB to approximately 193 kB, with the heavy dashboard modules emitted as route chunks.

## Acquisition research notes

Google’s official SEO guidance says that search engines can discover sites through links and sitemaps, that the crawler should be able to access the same CSS and JavaScript resources as users, and that descriptive URLs and clear site organization help users and search engines understand the site. Google’s Search Console guidance recommends verifying site ownership, checking the property dashboard, reviewing performance and index coverage, using URL Inspection, and monitoring security issues and manual actions.

Sources reviewed:

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://support.google.com/webmasters/answer/10267942?hl=en
