-- Remember the newest Paddle event applied to a subscription.
-- ============================================================================
-- Paddle can deliver webhooks late or out of order (retries after a timeout,
-- parallel delivery). paddle-webhook applied whatever arrived last, so an old
-- 'active' event arriving after a newer cancel or past-due event would quietly
-- put the row back. Every Paddle event carries occurred_at; the webhook now
-- stores the newest one it has applied here and ignores any event older than it.
--
-- Written only by paddle-webhook (service role). Like every other column of this
-- table, a tenant's browser cannot touch it (the self-service guard rejects all
-- tenant writes). paddle-cancel-subscription and paddle-manage-locations do not
-- set it: their changes are confirmed by the event Paddle sends afterwards,
-- which is newer than any event that came before.

BEGIN;

ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS paddle_event_at timestamptz;

COMMENT ON COLUMN public.platform_subscriptions.paddle_event_at IS
  'occurred_at of the newest Paddle webhook event applied to this row. paddle-webhook ignores events older than this. Service-role writes only.';

COMMIT;
