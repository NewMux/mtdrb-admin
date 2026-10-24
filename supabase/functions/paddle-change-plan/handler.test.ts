import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildProItems, handleChangePlan, parseAction, readChargeNow, type ChangePlanDeps, type ChangePlanRequest } from "./handler";

const ORIGIN = "https://app.example.com";

const prices = {
  starterPriceId: "pri_starter",
  proPriceId: "pri_pro",
  starterExtraPriceId: "pri_starter_extra",
  proExtraPriceId: "pri_pro_extra",
};

const item = (priceId: string, quantity = 1, amount = "4900", status = "active") => ({
  status,
  quantity,
  price: { id: priceId, unit_price: { amount, currency_code: "USD" } },
});

const caller = { tenant_id: "tenant-1", is_admin: true };
const sub = { plan_tier: "starter", status: "active", payment_provider: "paddle", payment_reference: "sub_1", cancel_at: null, extra_locations: 0 };

const starterSub = (...extra: ReturnType<typeof item>[]) => ({ ok: true, subscription: { items: [item("pri_starter"), ...extra] } });

function makeDeps(over: Partial<ChangePlanDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    prices,
    paddleConfigured: true,
    getCaller: vi.fn().mockResolvedValue(caller),
    loadSubscription: vi.fn().mockResolvedValue(sub),
    rateLimit: vi.fn().mockResolvedValue(true),
    getPaddleSubscription: vi.fn().mockResolvedValue(starterSub()),
    // By default Paddle echoes back whatever was requested, priced at 8900 per base.
    previewUpdate: vi.fn().mockImplementation(async (_id: string, items: { price_id: string; quantity: number }[]) => ({
      ok: true,
      subscription: {
        items: items.map((i) => item(i.price_id, i.quantity, i.price_id === "pri_pro" ? "8900" : "4000")),
        next_billed_at: "2026-11-24T00:00:00Z",
        immediate_transaction: { details: { totals: { grand_total: "2150", currency_code: "USD" } } },
      },
    })),
    applyUpdate: vi.fn().mockImplementation(async (_id: string, items: { price_id: string; quantity: number }[]) => ({
      ok: true,
      subscription: { items: items.map((i) => item(i.price_id, i.quantity, i.price_id === "pri_pro" ? "8900" : "4000")) },
    })),
    saveUpgrade: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & ChangePlanDeps;
}

const req = (over: Partial<ChangePlanRequest> = {}, body: unknown = { action: "upgrade" }): ChangePlanRequest => ({
  method: "POST",
  origin: ORIGIN,
  authorization: "Bearer good.jwt.token",
  bodyText: JSON.stringify(body),
  ...over,
});
const json = (r: { body: string | null }) => JSON.parse(r.body ?? "null");

let deps: ReturnType<typeof makeDeps>;
beforeEach(() => {
  deps = makeDeps();
});

describe("parseAction", () => {
  it("accepts preview and upgrade only", () => {
    expect(parseAction({ action: "preview" })).toBe("preview");
    expect(parseAction({ action: "upgrade" })).toBe("upgrade");
    for (const bad of [{ action: "downgrade" }, { action: 1 }, {}, [], null, "upgrade"]) {
      expect(parseAction(bad)).toBeNull();
    }
  });
});

describe("CORS and request shape", () => {
  it("answers the preflight without a token, and only for allowed origins", async () => {
    const ok = await handleChangePlan(req({ method: "OPTIONS", authorization: null, bodyText: "" }), deps);
    expect(ok.status).toBe(204);
    expect(ok.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    expect(ok.headers["Access-Control-Allow-Headers"]).toContain("x-application-name");
    const bad = await handleChangePlan(req({ method: "OPTIONS", origin: "https://evil.example" }), deps);
    expect(bad.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("refuses other methods and a missing/odd token without calling anything", async () => {
    expect((await handleChangePlan(req({ method: "GET" }), deps)).status).toBe(405);
    expect((await handleChangePlan(req({ authorization: null }), deps)).status).toBe(401);
    expect((await handleChangePlan(req({ authorization: "Basic x" }), deps)).status).toBe(401);
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("400 for bad JSON or an unknown action, 413 for a huge body, before any billing call", async () => {
    expect((await handleChangePlan(req({ bodyText: "{nope" }), deps)).status).toBe(400);
    expect((await handleChangePlan(req({}, { action: "downgrade" }), deps)).status).toBe(400);
    expect((await handleChangePlan(req({ bodyText: " ".repeat(2000) }), deps)).status).toBe(413);
    expect(deps.getPaddleSubscription).not.toHaveBeenCalled();
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });
});

describe("who may call it", () => {
  it("401 when the token does not resolve to a gym or resolving throws", async () => {
    deps = makeDeps({ getCaller: vi.fn().mockResolvedValue(null) });
    expect((await handleChangePlan(req(), deps)).status).toBe(401);
    deps = makeDeps({ getCaller: vi.fn().mockRejectedValue(new Error("JWT expired")) });
    expect((await handleChangePlan(req(), deps)).status).toBe(401);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  it("403 for a signed-in member who is not an admin, before anything else is looked at", async () => {
    deps = makeDeps({ getCaller: vi.fn().mockResolvedValue({ ...caller, is_admin: false }) });
    const r = await handleChangePlan(req(), deps);
    expect(r.status).toBe(403);
    expect(deps.loadSubscription).not.toHaveBeenCalled();
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.previewUpdate).not.toHaveBeenCalled();
  });

  it("acts on the caller's own gym whatever the body says", async () => {
    await handleChangePlan(req({}, { action: "upgrade", tenant_id: "someone-else", price_id: "pri_x" }), deps);
    expect(deps.loadSubscription).toHaveBeenCalledWith("tenant-1");
    expect(deps.saveUpgrade).toHaveBeenCalledWith("tenant-1", expect.anything());
    // The price is never taken from the request.
    expect(deps.applyUpdate).toHaveBeenCalledWith("sub_1", [{ price_id: "pri_pro", quantity: 1 }]);
  });

  it("429 when rate limited (tighter for the charging action), and carries on if the limiter is down", async () => {
    deps = makeDeps({ rateLimit: vi.fn().mockResolvedValue(false) });
    expect((await handleChangePlan(req(), deps)).status).toBe(429);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.rateLimit).toHaveBeenCalledWith("paddle-change-plan:upgrade:tenant-1", 10);
    await handleChangePlan(req({}, { action: "preview" }), deps);
    expect(deps.rateLimit).toHaveBeenCalledWith("paddle-change-plan:preview:tenant-1", 30);
    deps = makeDeps({ rateLimit: vi.fn().mockRejectedValue(new Error("db down")) });
    expect((await handleChangePlan(req(), deps)).status).toBe(200);
  });
});

describe("which subscriptions can be upgraded here", () => {
  it.each([
    ["no subscription row", null],
    ["a manual grant", { ...sub, payment_provider: "manual", payment_reference: null }],
    ["a missing Paddle reference", { ...sub, payment_reference: null }],
    ["an enterprise plan", { ...sub, plan_tier: "enterprise" }],
    ["a demo plan", { ...sub, plan_tier: "demo" }],
    ["a subscription set to end", { ...sub, cancel_at: "2026-12-01T00:00:00Z" }],
  ])("409 for %s, with no Paddle call", async (_label, stored) => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue(stored) });
    const r = await handleChangePlan(req(), deps);
    expect(r.status).toBe(409);
    expect(deps.getPaddleSubscription).not.toHaveBeenCalled();
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  it.each([["cancelled"], ["failed"], ["expired"], ["trialing"]])("409 when the status is %s", async (status) => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...sub, status }) });
    expect((await handleChangePlan(req(), deps)).status).toBe(409);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  it("tells a gym with a failed payment to fix the card first", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...sub, status: "past_due" }) });
    const r = await handleChangePlan(req(), deps);
    expect(r.status).toBe(409);
    expect(json(r).error).toMatch(/payment method/i);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  it("503 when billing is not configured, with nothing sent to Paddle", async () => {
    for (const over of [
      { paddleConfigured: false },
      { prices: { ...prices, proPriceId: undefined } },
      { prices: { ...prices, starterPriceId: undefined } },
    ]) {
      deps = makeDeps(over);
      expect((await handleChangePlan(req(), deps)).status).toBe(503);
      expect(deps.getPaddleSubscription).not.toHaveBeenCalled();
      expect(deps.applyUpdate).not.toHaveBeenCalled();
    }
  });

  it("409 when Paddle's subscription is not on the Starter price (annual, or unknown)", async () => {
    deps = makeDeps({ getPaddleSubscription: vi.fn().mockResolvedValue({ ok: true, subscription: { items: [item("pri_annual")] } }) });
    const r = await handleChangePlan(req(), deps);
    expect(r.status).toBe(409);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  it("502 when Paddle cannot be read, and nothing is changed", async () => {
    deps = makeDeps({ getPaddleSubscription: vi.fn().mockResolvedValue({ ok: false, status: 0, detail: "timeout" }) });
    const r = await handleChangePlan(req(), deps);
    expect(r.status).toBe(502);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.saveUpgrade).not.toHaveBeenCalled();
  });
});

describe("buildProItems", () => {
  const raw = (...entries: ReturnType<typeof item>[]) => entries as unknown[];

  it("swaps Starter for Pro", () => {
    expect(buildProItems(raw(item("pri_starter")), prices, 0)).toEqual([{ price_id: "pri_pro", quantity: 1 }]);
  });

  it("moves extra locations onto the Pro add-on at the same quantity", () => {
    expect(buildProItems(raw(item("pri_starter"), item("pri_starter_extra", 3)), prices, 3)).toEqual([
      { price_id: "pri_pro", quantity: 1 },
      { price_id: "pri_pro_extra", quantity: 3 },
    ]);
  });

  it("keeps items it does not know about, and drops inactive ones", () => {
    expect(buildProItems(raw(item("pri_starter"), item("pri_other", 2), item("pri_gone", 1, "100", "inactive")), prices, 0)).toEqual([
      { price_id: "pri_other", quantity: 2 },
      { price_id: "pri_pro", quantity: 1 },
    ]);
  });
});

describe("readChargeNow", () => {
  it("prefers the immediate transaction's grand total, in major units", () => {
    expect(readChargeNow({ immediate_transaction: { details: { totals: { grand_total: "2150", currency_code: "USD" } } } })).toEqual({
      amount: 21.5,
      currency: "USD",
    });
  });

  it("honours the currency's decimals (BHD has three)", () => {
    expect(readChargeNow({ immediate_transaction: { details: { totals: { total: "21500", currency_code: "BHD" } } } })).toEqual({
      amount: 21.5,
      currency: "BHD",
    });
  });

  it("falls back to the update summary: a charge is the amount, a credit is nothing today", () => {
    expect(readChargeNow({ update_summary: { result: { action: "charge", amount: "1000", currency_code: "USD" } } })).toEqual({
      amount: 10,
      currency: "USD",
    });
    expect(readChargeNow({ update_summary: { result: { action: "credit", amount: "500", currency_code: "USD" } } })).toEqual({
      amount: 0,
      currency: "USD",
    });
  });

  it("returns null rather than guessing", () => {
    expect(readChargeNow({})).toBeNull();
    expect(readChargeNow({ immediate_transaction: { details: { totals: { grand_total: "12.50", currency_code: "USD" } } } })).toBeNull();
    expect(readChargeNow({ update_summary: { result: { action: "charge", amount: "1000" } } })).toBeNull();
  });
});

describe("preview", () => {
  const preview = () => handleChangePlan(req({}, { action: "preview" }), deps);

  it("reports what is charged today and the new recurring price, applying nothing", async () => {
    const r = await preview();
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({
      plan_tier: "pro",
      extra_locations: 0,
      charge_now: { amount: 21.5, currency: "USD" },
      recurring: { amount: 89, currency: "USD" },
      next_billed_at: "2026-11-24T00:00:00.000Z",
    });
    expect(deps.previewUpdate).toHaveBeenCalledWith("sub_1", [{ price_id: "pri_pro", quantity: 1 }]);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.saveUpgrade).not.toHaveBeenCalled();
  });

  it("includes extra locations in the recurring price", async () => {
    deps = makeDeps({ getPaddleSubscription: vi.fn().mockResolvedValue(starterSub(item("pri_starter_extra", 2))) });
    const r = await preview();
    expect(json(r).extra_locations).toBe(2);
    expect(json(r).recurring).toEqual({ amount: 89 + 2 * 40, currency: "USD" });
    expect(deps.previewUpdate).toHaveBeenCalledWith("sub_1", [
      { price_id: "pri_pro", quantity: 1 },
      { price_id: "pri_pro_extra", quantity: 2 },
    ]);
  });

  it("502 when Paddle will not preview", async () => {
    deps = makeDeps({ previewUpdate: vi.fn().mockResolvedValue({ ok: false, status: 400, detail: "{}" }) });
    expect((await preview()).status).toBe(502);
  });
});

describe("upgrade", () => {
  const upgrade = () => handleChangePlan(req(), deps);

  it("swaps the plan in Paddle, records Pro and the new amount", async () => {
    const r = await upgrade();
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ plan_tier: "pro", extra_locations: 0, synced: true });
    expect(deps.applyUpdate).toHaveBeenCalledWith("sub_1", [{ price_id: "pri_pro", quantity: 1 }]);
    expect(deps.saveUpgrade).toHaveBeenCalledWith("tenant-1", { planTier: "pro", amount: 89, currency: "USD", extraLocations: 0 });
  });

  it("carries paid extra locations over to the Pro add-on", async () => {
    deps = makeDeps({ getPaddleSubscription: vi.fn().mockResolvedValue(starterSub(item("pri_starter_extra", 3))) });
    const r = await upgrade();
    expect(json(r)).toMatchObject({ plan_tier: "pro", extra_locations: 3 });
    expect(deps.applyUpdate).toHaveBeenCalledWith("sub_1", [
      { price_id: "pri_pro", quantity: 1 },
      { price_id: "pri_pro_extra", quantity: 3 },
    ]);
    expect(deps.saveUpgrade).toHaveBeenCalledWith("tenant-1", expect.objectContaining({ extraLocations: 3 }));
  });

  it("503 when the gym has extra locations but the Pro add-on price is not configured", async () => {
    deps = makeDeps({
      prices: { ...prices, proExtraPriceId: undefined },
      getPaddleSubscription: vi.fn().mockResolvedValue(starterSub(item("pri_starter_extra", 2))),
    });
    expect((await upgrade()).status).toBe(503);
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });

  it("a declined card or any Paddle refusal leaves everything as it was", async () => {
    deps = makeDeps({ applyUpdate: vi.fn().mockResolvedValue({ ok: false, status: 400, detail: '{"code":"subscription_payment_declined"}' }) });
    const r = await upgrade();
    expect(r.status).toBe(502);
    expect(json(r).error).toMatch(/not charged/i);
    expect(deps.saveUpgrade).not.toHaveBeenCalled();
  });

  it("succeeds with synced:false when billing changed but the record could not be saved", async () => {
    deps = makeDeps({ saveUpgrade: vi.fn().mockRejectedValue(new Error("db down")) });
    const r = await upgrade();
    expect(r.status).toBe(200);
    expect(json(r)).toMatchObject({ plan_tier: "pro", synced: false });
  });

  it("does not record Pro if Paddle's answer does not show it (the webhook will settle it)", async () => {
    deps = makeDeps({ applyUpdate: vi.fn().mockResolvedValue({ ok: true, subscription: { items: [item("pri_starter")] } }) });
    const r = await upgrade();
    expect(r.status).toBe(200);
    expect(json(r).synced).toBe(false);
    expect(deps.saveUpgrade).not.toHaveBeenCalled();
  });

  it("is idempotent: a second call finds Pro already in billing, charges nothing and repairs the record", async () => {
    deps = makeDeps({
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, plan_tier: "pro" }),
      getPaddleSubscription: vi.fn().mockResolvedValue({ ok: true, subscription: { items: [item("pri_pro", 1, "8900")] } }),
    });
    const r = await upgrade();
    expect(r.status).toBe(200);
    expect(json(r)).toMatchObject({ already: true, plan_tier: "pro", synced: true });
    expect(deps.applyUpdate).not.toHaveBeenCalled();
    expect(deps.previewUpdate).not.toHaveBeenCalled();
  });

  it("repairs a record that still says Starter when billing already shows Pro", async () => {
    deps = makeDeps({
      getPaddleSubscription: vi.fn().mockResolvedValue({ ok: true, subscription: { items: [item("pri_pro", 1, "8900")] } }),
    });
    const r = await upgrade();
    expect(json(r)).toMatchObject({ already: true });
    expect(deps.saveUpgrade).toHaveBeenCalledWith("tenant-1", expect.objectContaining({ planTier: "pro", amount: 89 }));
    expect(deps.applyUpdate).not.toHaveBeenCalled();
  });
});
