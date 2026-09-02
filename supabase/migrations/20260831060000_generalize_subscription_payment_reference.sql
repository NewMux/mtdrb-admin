-- Generalize platform_subscriptions' payment-provider reference column
-- ============================================================================
-- tap_subscription_id was added when a Tap Payments integration was scaffolded
-- (never wired up -- dead code, removed alongside this migration). We're
-- integrating CrediMax (Mastercard Payment Gateway Services) instead, so
-- rename the column to a gateway-agnostic name and record which provider a
-- given subscription's reference belongs to, so a future gateway swap doesn't
-- require another rename.

BEGIN;

ALTER TABLE public.platform_subscriptions
  RENAME COLUMN tap_subscription_id TO payment_reference;

ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'credimax';

COMMENT ON COLUMN public.platform_subscriptions.payment_reference IS
  'The payment gateway''s own identifier for this subscription''s order/session (e.g. CrediMax/MPGS order.id). Gateway-agnostic column name -- see payment_provider for which gateway it belongs to.';
COMMENT ON COLUMN public.platform_subscriptions.payment_provider IS
  'Which payment gateway payment_reference belongs to. Only ''credimax'' is wired up today.';

COMMIT;
