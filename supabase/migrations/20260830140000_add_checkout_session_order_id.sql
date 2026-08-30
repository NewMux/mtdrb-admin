-- Add mpgs_order_id to platform_checkout_sessions
-- ============================================================================
-- The create-checkout-session Edge Function generates its own order.id and
-- passes it to MPGS's Initiate Checkout request (order.id) and in the
-- returnUrl query string. mpgs_session_id alone (the value MPGS itself
-- generates and returns) isn't enough to correlate a webhook notification
-- back to our row without more certainty about what identifier the
-- notification payload carries - order.id is the value we control end to
-- end and is far more likely to appear on any transaction/order-scoped
-- notification, so the webhook handler needs both to look up by.
--
-- Split into its own migration rather than editing
-- 20260830130000_create_platform_checkout_sessions.sql directly, following
-- this repo's existing convention of fixing up an already-committed table
-- via a follow-up migration (see
-- 20260815112046_fix_classes_missing_updated_at_column.sql).

BEGIN;

ALTER TABLE public.platform_checkout_sessions
  ADD COLUMN mpgs_order_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.platform_checkout_sessions
  ALTER COLUMN mpgs_order_id DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_checkout_sessions_mpgs_order_id
  ON public.platform_checkout_sessions(mpgs_order_id);

COMMIT;
