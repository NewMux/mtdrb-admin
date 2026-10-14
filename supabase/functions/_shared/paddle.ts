// Pure Paddle Billing helpers shared by paddle-webhook and
// paddle-cancel-subscription. No Deno globals here, so the vitest suite can
// import this file directly (see paddle.test.ts).
//
// Shapes follow Paddle's public Billing API v2 documentation
// (developer.paddle.com): the Paddle-Signature header, the event envelope
// (event_id, event_type, occurred_at, data) and the subscription entity
// (status, items[].price, current_billing_period, scheduled_change,
// custom_data). They were written without access to the paddle-docs MCP
// server, so confirm them against real sandbox deliveries before launch.

// Paddle signs each delivery attempt with the time it was sent. Anything
// older than this is treated as a replay of a captured request.
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type SignatureCheck =
  | { ok: true }
  | { ok: false; reason: "malformed" | "expired" | "mismatch" };

// Header format: "ts=<unix_seconds>;h1=<hex_hmac_sha256>". While a secret is
// being rotated Paddle can send more than one h1, so accept a match on any.
export function parseSignatureHeader(header: string): { ts?: string; h1: string[] } {
  const result: { ts?: string; h1: string[] } = { h1: [] };
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "ts") result.ts = value;
    else if (key === "h1" && value) result.h1.push(value);
  }
  return result;
}

export async function verifyPaddleSignature(
  rawBody: string,
  header: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<SignatureCheck> {
  const { ts, h1 } = parseSignatureHeader(header);
  if (!ts || !/^\d+$/.test(ts) || h1.length === 0) return { ok: false, reason: "malformed" };

  if (Math.abs(nowSeconds - Number(ts)) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "expired" };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${rawBody}`));
  const computed = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return h1.some((candidate) => timingSafeEqualHex(computed, candidate.toLowerCase()))
    ? { ok: true }
    : { ok: false, reason: "mismatch" };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Paddle sends money as a string in the currency's smallest unit. The
// number of decimals depends on the currency (JPY 0, USD 2, BHD 3), so
// dividing by 100 everywhere was wrong for anything but 2-decimal
// currencies. ISO 4217 minor units come from Intl.
export function currencyDecimals(currencyCode: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currencyCode })
      .resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function minorUnitsToAmount(amount: string, currencyCode: string): number | null {
  if (!/^-?\d+$/.test(amount)) return null;
  const decimals = currencyDecimals(currencyCode);
  return Number(amount) / 10 ** decimals;
}

// Paddle: active | trialing | past_due | paused | canceled
// Ours:   active | trialing | past_due | cancelled
export function mapSubscriptionStatus(paddleStatus: string): "active" | "trialing" | "past_due" | "cancelled" {
  if (paddleStatus === "active" || paddleStatus === "trialing" || paddleStatus === "past_due") {
    return paddleStatus;
  }
  return "cancelled";
}

export type SubscriptionEventRecord = {
  p_tenant_id: string;
  p_subscription_id: string;
  p_occurred_at: string;
  p_status: string;
  p_paddle_status: string;
  p_plan_tier: string | null;
  p_amount: number | null;
  p_currency: string | null;
  p_current_period_end: string | null;
  p_trial_end: string | null;
  p_scheduled_change: unknown;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PriceIdToPlan = (priceId: string | undefined) => string | undefined;

// Turns a subscription.* event into the arguments for the
// record_paddle_subscription_event() database function, or an error
// string saying why it can't be applied.
export function toSubscriptionEventRecord(
  event: { occurred_at?: unknown; data?: Record<string, unknown> },
  priceIdToPlan: PriceIdToPlan,
): SubscriptionEventRecord | { error: string } {
  const data = event.data ?? {};
  const customData = (data.custom_data ?? {}) as Record<string, unknown>;
  const tenantId = typeof customData.tenant_id === "string" ? customData.tenant_id : undefined;
  if (!tenantId || !UUID_PATTERN.test(tenantId)) return { error: "missing or invalid custom_data.tenant_id" };

  const subscriptionId = typeof data.id === "string" ? data.id : undefined;
  if (!subscriptionId) return { error: "missing subscription id" };

  const occurredAt = typeof event.occurred_at === "string" ? event.occurred_at : undefined;
  if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) return { error: "missing occurred_at" };

  const items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
  const price = items[0]?.price as Record<string, unknown> | undefined;
  const priceId = typeof price?.id === "string" ? price.id : undefined;
  const unitPrice = price?.unit_price as Record<string, unknown> | undefined;
  const currency = typeof unitPrice?.currency_code === "string" ? unitPrice.currency_code : null;
  const amount =
    currency && typeof unitPrice?.amount === "string" ? minorUnitsToAmount(unitPrice.amount, currency) : null;

  const paddleStatus = typeof data.status === "string" ? data.status : "canceled";
  const status = mapSubscriptionStatus(paddleStatus);

  // The paid-through date is the end of the current billing period, not
  // next_billed_at: next_billed_at is null once a cancellation is
  // scheduled, even though the customer keeps access until the period
  // ends. Paddle clears current_billing_period on canceled/paused
  // subscriptions, which correctly ends access.
  const period = data.current_billing_period as Record<string, unknown> | null | undefined;
  const periodEnd = typeof period?.ends_at === "string" ? period.ends_at : null;

  return {
    p_tenant_id: tenantId,
    p_subscription_id: subscriptionId,
    p_occurred_at: occurredAt,
    p_status: status,
    p_paddle_status: paddleStatus,
    p_plan_tier: priceIdToPlan(priceId) ?? null,
    p_amount: amount,
    p_currency: currency,
    p_current_period_end: status === "trialing" ? null : periodEnd,
    p_trial_end: status === "trialing" ? periodEnd : null,
    p_scheduled_change: data.scheduled_change ?? null,
  };
}

// Sandbox API keys contain "_sdbx" (see CLAUDE.md). Refuse to call the
// live API with a sandbox key or vice versa rather than failing obscurely.
export function paddleApiBase(environment: string, apiKey: string): string {
  const isSandboxKey = apiKey.includes("_sdbx");
  if (environment === "production") {
    if (isSandboxKey) throw new Error("PADDLE_API_KEY is a sandbox key but PADDLE_ENVIRONMENT is production");
    return "https://api.paddle.com";
  }
  if (!isSandboxKey) throw new Error("PADDLE_API_KEY is not a sandbox key but PADDLE_ENVIRONMENT is sandbox");
  return "https://sandbox-api.paddle.com";
}
