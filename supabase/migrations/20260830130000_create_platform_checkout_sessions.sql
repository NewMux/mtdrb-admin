-- Platform checkout sessions (MPGS/CrediMax payment integration)
-- ============================================================================
-- Tracks a pending Hosted Checkout session between "admin clicked Upgrade"
-- and the async webhook confirming the transaction result. Two things this
-- table exists for that platform_subscriptions can't do alone:
--
--   1. Idempotency: the MPGS webhook may fire more than once for the same
--      order. Looking it up by mpgs_session_id (UNIQUE) lets the webhook
--      handler no-op safely on a repeat delivery instead of double-applying
--      a charge result.
--   2. Correlating a returning browser session back to a tenant/plan/amount
--      without trusting anything the client supplies at confirmation time -
--      the session row was written server-side (by create-checkout-session,
--      itself running under a verified admin JWT) at the moment the price
--      was decided, before the cardholder ever reached MPGS's hosted page.
--
-- Unlike platform_subscriptions, there is no legitimate self-service write
-- path here at all: a session is only ever created by the
-- create-checkout-session Edge Function and only ever completed/failed by
-- the mpgs-webhook Edge Function, both under the service role key. So this
-- intentionally has no INSERT/UPDATE/DELETE policy for authenticated/anon -
-- RLS defaults to deny, and service_role bypasses RLS entirely as usual.
-- Tenant admins may only ever SELECT their own tenant's rows (e.g. to show
-- "payment processing..." status in the UI while polling).

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mpgs_session_id TEXT NOT NULL UNIQUE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('starter', 'pro', 'enterprise', 'demo')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_platform_checkout_sessions_tenant_id
  ON public.platform_checkout_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_checkout_sessions_status
  ON public.platform_checkout_sessions(status);

ALTER TABLE public.platform_checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_checkout_sessions_select_admin
  ON public.platform_checkout_sessions FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND public.has_tenant_role(tenant_id, 'admin'));

CREATE TRIGGER update_platform_checkout_sessions_updated_at
  BEFORE UPDATE ON public.platform_checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
