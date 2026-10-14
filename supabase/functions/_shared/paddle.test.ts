// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  currencyDecimals,
  mapSubscriptionStatus,
  minorUnitsToAmount,
  paddleApiBase,
  parseSignatureHeader,
  toSubscriptionEventRecord,
  verifyPaddleSignature,
} from "./paddle.ts";

const SECRET = "pdl_ntfset_test_secret";
const sign = (ts: number, body: string, secret = SECRET) =>
  createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");

describe("verifyPaddleSignature", () => {
  const body = JSON.stringify({ event_type: "subscription.updated" });
  const now = 1_760_000_000;

  it("accepts a valid, fresh signature", async () => {
    const header = `ts=${now};h1=${sign(now, body)}`;
    expect(await verifyPaddleSignature(body, header, SECRET, now)).toEqual({ ok: true });
  });

  it("rejects a tampered body", async () => {
    const header = `ts=${now};h1=${sign(now, body)}`;
    expect(await verifyPaddleSignature(`${body} `, header, SECRET, now)).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a replay older than the tolerance window", async () => {
    const old = now - 301;
    const header = `ts=${old};h1=${sign(old, body)}`;
    expect(await verifyPaddleSignature(body, header, SECRET, now)).toEqual({ ok: false, reason: "expired" });
  });

  it("accepts any of several h1 values during secret rotation", async () => {
    const header = `ts=${now};h1=${sign(now, body, "old_secret")};h1=${sign(now, body)}`;
    expect(await verifyPaddleSignature(body, header, SECRET, now)).toEqual({ ok: true });
  });

  it("rejects malformed headers", async () => {
    for (const header of ["", "h1=abc", `ts=${now}`, `ts=abc;h1=${sign(now, body)}`]) {
      expect(await verifyPaddleSignature(body, header, SECRET, now)).toEqual({ ok: false, reason: "malformed" });
    }
  });

  it("parses headers with whitespace", () => {
    expect(parseSignatureHeader(" ts=1 ; h1=aa ")).toEqual({ ts: "1", h1: ["aa"] });
  });
});

describe("minorUnitsToAmount", () => {
  it("uses each currency's own number of decimals", () => {
    expect(currencyDecimals("USD")).toBe(2);
    expect(currencyDecimals("BHD")).toBe(3);
    expect(currencyDecimals("JPY")).toBe(0);
    expect(minorUnitsToAmount("8000", "USD")).toBe(80);
    expect(minorUnitsToAmount("35000", "BHD")).toBe(35);
    expect(minorUnitsToAmount("1200", "JPY")).toBe(1200);
  });

  it("rejects non-integer strings", () => {
    expect(minorUnitsToAmount("80.00", "USD")).toBeNull();
    expect(minorUnitsToAmount("", "USD")).toBeNull();
  });
});

describe("mapSubscriptionStatus", () => {
  it("keeps past_due distinct and folds paused/canceled into cancelled", () => {
    expect(mapSubscriptionStatus("active")).toBe("active");
    expect(mapSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapSubscriptionStatus("paused")).toBe("cancelled");
    expect(mapSubscriptionStatus("canceled")).toBe("cancelled");
  });
});

describe("toSubscriptionEventRecord", () => {
  const tenantId = "8f14e45f-ceea-4e7a-9c3b-1d2e3f4a5b6c";
  const priceIdToPlan = (id: string | undefined) => (id === "pri_pro" ? "pro" : undefined);
  const baseEvent = {
    event_id: "evt_1",
    occurred_at: "2026-10-01T10:00:00.000Z",
    data: {
      id: "sub_1",
      status: "active",
      custom_data: { tenant_id: tenantId },
      items: [{ price: { id: "pri_pro", unit_price: { amount: "8000", currency_code: "USD" } } }],
      current_billing_period: { starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-11-01T00:00:00Z" },
      next_billed_at: "2026-11-01T00:00:00Z",
      scheduled_change: null,
    },
  };

  it("maps an active subscription to its paid-through date", () => {
    expect(toSubscriptionEventRecord(baseEvent, priceIdToPlan)).toEqual({
      p_tenant_id: tenantId,
      p_subscription_id: "sub_1",
      p_occurred_at: "2026-10-01T10:00:00.000Z",
      p_status: "active",
      p_paddle_status: "active",
      p_plan_tier: "pro",
      p_amount: 80,
      p_currency: "USD",
      p_current_period_end: "2026-11-01T00:00:00Z",
      p_trial_end: null,
      p_scheduled_change: null,
    });
  });

  it("keeps the period end when a cancellation is scheduled (next_billed_at is null)", () => {
    const event = {
      ...baseEvent,
      data: {
        ...baseEvent.data,
        next_billed_at: null,
        scheduled_change: { action: "cancel", effective_at: "2026-11-01T00:00:00Z", resume_at: null },
      },
    };
    const record = toSubscriptionEventRecord(event, priceIdToPlan);
    expect(record).toMatchObject({
      p_status: "active",
      p_current_period_end: "2026-11-01T00:00:00Z",
      p_scheduled_change: { action: "cancel" },
    });
  });

  it("puts a trial's period end in trial_end", () => {
    const event = { ...baseEvent, data: { ...baseEvent.data, status: "trialing" } };
    expect(toSubscriptionEventRecord(event, priceIdToPlan)).toMatchObject({
      p_status: "trialing",
      p_trial_end: "2026-11-01T00:00:00Z",
      p_current_period_end: null,
    });
  });

  it("leaves plan_tier null for an unknown price", () => {
    const event = {
      ...baseEvent,
      data: { ...baseEvent.data, items: [{ price: { id: "pri_other", unit_price: { amount: "1", currency_code: "USD" } } }] },
    };
    expect(toSubscriptionEventRecord(event, priceIdToPlan)).toMatchObject({ p_plan_tier: null });
  });

  it("refuses events it cannot safely apply", () => {
    expect(
      toSubscriptionEventRecord({ ...baseEvent, data: { ...baseEvent.data, custom_data: {} } }, priceIdToPlan),
    ).toHaveProperty("error");
    expect(
      toSubscriptionEventRecord(
        { ...baseEvent, data: { ...baseEvent.data, custom_data: { tenant_id: "not-a-uuid" } } },
        priceIdToPlan,
      ),
    ).toHaveProperty("error");
    expect(toSubscriptionEventRecord({ ...baseEvent, occurred_at: undefined }, priceIdToPlan)).toHaveProperty("error");
    expect(
      toSubscriptionEventRecord({ ...baseEvent, data: { ...baseEvent.data, id: undefined } }, priceIdToPlan),
    ).toHaveProperty("error");
  });
});

describe("paddleApiBase", () => {
  it("matches the API host to the environment and refuses mismatched keys", () => {
    expect(paddleApiBase("sandbox", "pdl_sdbx_apikey_123")).toBe("https://sandbox-api.paddle.com");
    expect(paddleApiBase("production", "pdl_live_apikey_123")).toBe("https://api.paddle.com");
    expect(() => paddleApiBase("production", "pdl_sdbx_apikey_123")).toThrow();
    expect(() => paddleApiBase("sandbox", "pdl_live_apikey_123")).toThrow();
  });
});
