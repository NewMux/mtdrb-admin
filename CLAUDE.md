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
