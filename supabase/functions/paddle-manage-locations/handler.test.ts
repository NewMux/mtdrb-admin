import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleManageLocations, parseInput, type ManageDeps, type ManageRequest } from "./handler";

const ORIGIN = "https://app.example.com";

const prices = {
  starterPriceId: "pri_starter",
  proPriceId: "pri_pro",
  starterExtraPriceId: "pri_starter_extra",
  proExtraPriceId: "pri_pro_extra",
};

const item = (priceId: string, quantity = 1, status = "active") => ({
  status,
  quantity,
  price: { id: priceId, unit_price: { amount: "20000", currency_code: "BHD" } },
});

const usage = { tenant_id: "tenant-1", used: 1, limit: 1, extra_locations: 0, is_admin: true };
const sub = { plan_tier: "starter", status: "active", payment_provider: "paddle", payment_reference: "sub_1", extra_locations: 0 };

function makeDeps(over: Partial<ManageDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    maxExtra: 50,
    prices,
    paddleConfigured: true,
    getUsage: vi.fn().mockResolvedValue(usage),
    loadSubscription: vi.fn().mockResolvedValue(sub),
    rateLimit: vi.fn().mockResolvedValue(true),
    getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter")] }),
    // By default Paddle echoes back whatever was requested.
    updatePaddleItems: vi.fn().mockImplementation(async (_id: string, items: { price_id: string; quantity: number }[]) => ({
      ok: true,
      items: items.map((i) => item(i.price_id, i.quantity)),
    })),
    saveExtraLocations: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & ManageDeps;
}

const req = (over: Partial<ManageRequest> = {}, body: unknown = { extra_locations: 1 }): ManageRequest => ({
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

describe("parseInput", () => {
  it.each([[0], [1], [50]])("accepts %i", (n) => {
    expect(parseInput({ extra_locations: n }, 50)).toEqual({ ok: true, extraLocations: n });
  });
  it.each([[-1], [51], [1.5], ["2"], [null], [undefined], [NaN]])("rejects %s", (n) => {
    expect(parseInput({ extra_locations: n }, 50).ok).toBe(false);
  });
  it("rejects non-objects", () => {
    expect(parseInput([1], 50).ok).toBe(false);
    expect(parseInput(null, 50).ok).toBe(false);
    expect(parseInput("1", 50).ok).toBe(false);
  });
});

describe("CORS and request shape", () => {
  it("answers the preflight without needing a token", async () => {
    const r = await handleManageLocations(req({ method: "OPTIONS", authorization: null, bodyText: "" }), deps);
    expect(r.status).toBe(204);
    expect(r.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    expect(deps.getUsage).not.toHaveBeenCalled();
  });

  it("gives no CORS headers to an origin that is not allowed", async () => {
    const r = await handleManageLocations(req({ origin: "https://evil.example" }), deps);
    expect(r.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("refuses other methods and a missing/odd token without calling anything", async () => {
    expect((await handleManageLocations(req({ method: "GET" }), deps)).status).toBe(405);
    expect((await handleManageLocations(req({ authorization: null }), deps)).status).toBe(401);
    expect((await handleManageLocations(req({ authorization: "Basic abc" }), deps)).status).toBe(401);
    expect(deps.getUsage).not.toHaveBeenCalled();
  });
});

describe("who may call it", () => {
  it("401 when the token does not resolve to a gym", async () => {
    deps = makeDeps({ getUsage: vi.fn().mockResolvedValue(null) });
    expect((await handleManageLocations(req(), deps)).status).toBe(401);
  });

  it("401 when resolving the caller throws (bad JWT)", async () => {
    deps = makeDeps({ getUsage: vi.fn().mockRejectedValue(new Error("JWT expired")) });
    expect((await handleManageLocations(req(), deps)).status).toBe(401);
    expect(deps.getPaddleItems).not.toHaveBeenCalled();
  });

  it("403 for a signed-in member who is not an admin, before any billing call", async () => {
    deps = makeDeps({ getUsage: vi.fn().mockResolvedValue({ ...usage, is_admin: false }) });
    const r = await handleManageLocations(req(), deps);
    expect(r.status).toBe(403);
    expect(deps.loadSubscription).not.toHaveBeenCalled();
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
  });

  it("always acts on the caller's own gym, whatever the body says", async () => {
    const r = await handleManageLocations(req({}, { extra_locations: 1, tenant_id: "someone-else" }), deps);
    expect(r.status).toBe(200);
    expect(deps.loadSubscription).toHaveBeenCalledWith("tenant-1");
    expect(deps.saveExtraLocations).toHaveBeenCalledWith("tenant-1", 1);
  });
});

describe("input and limits", () => {
  it("400 for bad JSON or a bad number, and 413 for a huge body", async () => {
    expect((await handleManageLocations(req({ bodyText: "{nope" }), deps)).status).toBe(400);
    expect((await handleManageLocations(req({}, { extra_locations: -1 }), deps)).status).toBe(400);
    expect((await handleManageLocations(req({}, { extra_locations: 999 }), deps)).status).toBe(400);
    expect((await handleManageLocations(req({ bodyText: " ".repeat(5000) }), deps)).status).toBe(413);
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
  });

  it("429 when rate limited, and carries on if the limiter itself is down", async () => {
    deps = makeDeps({ rateLimit: vi.fn().mockResolvedValue(false) });
    expect((await handleManageLocations(req(), deps)).status).toBe(429);
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();

    deps = makeDeps({ rateLimit: vi.fn().mockRejectedValue(new Error("db down")) });
    expect((await handleManageLocations(req(), deps)).status).toBe(200);
  });

  it("cannot reduce below the locations in use", async () => {
    deps = makeDeps({ getUsage: vi.fn().mockResolvedValue({ ...usage, used: 3, extra_locations: 2 }) });
    const r = await handleManageLocations(req({}, { extra_locations: 1 }), deps);
    expect(r.status).toBe(409);
    expect(json(r).error).toContain("3 locations in use");
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
  });

  it("can reduce to exactly what is in use", async () => {
    deps = makeDeps({
      getUsage: vi.fn().mockResolvedValue({ ...usage, used: 3, extra_locations: 4 }),
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, extra_locations: 4 }),
      getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter"), item("pri_starter_extra", 4)] }),
    });
    expect((await handleManageLocations(req({}, { extra_locations: 2 }), deps)).status).toBe(200);
  });

  it("a gym with no branches yet may hold zero extras", async () => {
    deps = makeDeps({ getUsage: vi.fn().mockResolvedValue({ ...usage, used: 0 }) });
    expect((await handleManageLocations(req({}, { extra_locations: 0 }), deps)).status).toBe(200);
  });
});

describe("which subscriptions can change", () => {
  it.each([
    ["no subscription row", null],
    ["a manual grant", { ...sub, payment_provider: "manual", payment_reference: null }],
    ["a missing Paddle reference", { ...sub, payment_reference: null }],
    ["a cancelled subscription", { ...sub, status: "cancelled" }],
    ["a trialing subscription", { ...sub, status: "trialing" }],
    ["an enterprise tier", { ...sub, plan_tier: "enterprise" }],
  ])("409 for %s, with no Paddle calls", async (_label, stored) => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue(stored) });
    const r = await handleManageLocations(req(), deps);
    expect(r.status).toBe(409);
    expect(deps.getPaddleItems).not.toHaveBeenCalled();
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
    expect(deps.saveExtraLocations).not.toHaveBeenCalled();
  });

  it("500 when the subscription cannot be loaded", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockRejectedValue(new Error("db")) });
    expect((await handleManageLocations(req(), deps)).status).toBe(500);
  });

  it("503 when billing is not configured (no API key, or no add-on price for the plan)", async () => {
    deps = makeDeps({ paddleConfigured: false });
    expect((await handleManageLocations(req(), deps)).status).toBe(503);

    deps = makeDeps({ prices: { ...prices, starterExtraPriceId: undefined } });
    expect((await handleManageLocations(req(), deps)).status).toBe(503);
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
  });
});

describe("talking to Paddle", () => {
  it("adds an extra location: keeps the base item, adds the add-on, prorates immediately", async () => {
    const r = await handleManageLocations(req({}, { extra_locations: 1 }), deps);
    expect(r.status).toBe(200);
    expect(deps.updatePaddleItems).toHaveBeenCalledWith(
      "sub_1",
      [
        { price_id: "pri_starter", quantity: 1 },
        { price_id: "pri_starter_extra", quantity: 1 },
      ],
      "prorated_immediately",
    );
    expect(deps.saveExtraLocations).toHaveBeenCalledWith("tenant-1", 1);
    expect(json(r)).toEqual({ extra_locations: 1, limit: 2, synced: true });
  });

  it("uses the add-on price that belongs to the plan", async () => {
    deps = makeDeps({
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, plan_tier: "pro" }),
      getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_pro")] }),
    });
    await handleManageLocations(req({}, { extra_locations: 2 }), deps);
    expect(deps.updatePaddleItems).toHaveBeenCalledWith(
      "sub_1",
      [
        { price_id: "pri_pro", quantity: 1 },
        { price_id: "pri_pro_extra", quantity: 2 },
      ],
      "prorated_immediately",
    );
  });

  it("uses an absolute quantity, so repeating a request cannot charge twice", async () => {
    deps = makeDeps({
      getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter"), item("pri_starter_extra", 3)] }),
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, extra_locations: 3 }),
      getUsage: vi.fn().mockResolvedValue({ ...usage, used: 4, extra_locations: 3 }),
    });
    const r = await handleManageLocations(req({}, { extra_locations: 3 }), deps);
    expect(r.status).toBe(200);
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
    expect(json(r).extra_locations).toBe(3);
  });

  it("reducing: replaces only the add-on and waits for the next renewal", async () => {
    deps = makeDeps({
      getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter_extra", 3), item("pri_starter")] }),
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, extra_locations: 3 }),
    });
    await handleManageLocations(req({}, { extra_locations: 1 }), deps);
    expect(deps.updatePaddleItems).toHaveBeenCalledWith(
      "sub_1",
      [
        { price_id: "pri_starter", quantity: 1 },
        { price_id: "pri_starter_extra", quantity: 1 },
      ],
      "prorated_next_billing_period",
    );
  });

  it("reducing to zero sends the base plan alone", async () => {
    deps = makeDeps({
      getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter"), item("pri_starter_extra", 2)] }),
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, extra_locations: 2 }),
    });
    await handleManageLocations(req({}, { extra_locations: 0 }), deps);
    expect(deps.updatePaddleItems).toHaveBeenCalledWith("sub_1", [{ price_id: "pri_starter", quantity: 1 }], "prorated_next_billing_period");
    expect(deps.saveExtraLocations).toHaveBeenCalledWith("tenant-1", 0);
  });

  it("keeps whatever base price the subscription already has (e.g. an annual one) and drops inactive items", async () => {
    deps = makeDeps({
      getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_other_billing_cycle"), item("pri_gone", 1, "inactive")] }),
    });
    await handleManageLocations(req({}, { extra_locations: 1 }), deps);
    expect(deps.updatePaddleItems).toHaveBeenCalledWith(
      "sub_1",
      [
        { price_id: "pri_other_billing_cycle", quantity: 1 },
        { price_id: "pri_starter_extra", quantity: 1 },
      ],
      "prorated_immediately",
    );
  });

  it("refuses to PATCH when the subscription has no base item (it would replace the plan with the add-on)", async () => {
    deps = makeDeps({ getPaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter_extra", 1)] }) });
    const r = await handleManageLocations(req({}, { extra_locations: 2 }), deps);
    expect(r.status).toBe(502);
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
    expect(deps.saveExtraLocations).not.toHaveBeenCalled();
  });

  it("502 and nothing saved when Paddle cannot be read", async () => {
    deps = makeDeps({ getPaddleItems: vi.fn().mockResolvedValue({ ok: false, status: 500, detail: "{}" }) });
    const r = await handleManageLocations(req(), deps);
    expect(r.status).toBe(502);
    expect(deps.updatePaddleItems).not.toHaveBeenCalled();
    expect(deps.saveExtraLocations).not.toHaveBeenCalled();
  });

  it("502 and nothing saved when Paddle rejects the change (e.g. a failed payment)", async () => {
    deps = makeDeps({ updatePaddleItems: vi.fn().mockResolvedValue({ ok: false, status: 400, detail: '{"code":"subscription_payment_failed"}' }) });
    const r = await handleManageLocations(req(), deps);
    expect(r.status).toBe(502);
    expect(json(r).error).toContain("nothing was charged");
    expect(deps.saveExtraLocations).not.toHaveBeenCalled();
  });

  it("records what Paddle reports, not what was asked, if they differ", async () => {
    deps = makeDeps({
      updatePaddleItems: vi.fn().mockResolvedValue({ ok: true, items: [item("pri_starter"), item("pri_starter_extra", 1)] }),
    });
    const r = await handleManageLocations(req({}, { extra_locations: 2 }), deps);
    expect(deps.saveExtraLocations).toHaveBeenCalledWith("tenant-1", 1);
    expect(json(r).extra_locations).toBe(1);
    expect(deps.log).toHaveBeenCalled();
  });

  it("still reports success (synced:false) if the money moved but the database write failed", async () => {
    deps = makeDeps({ saveExtraLocations: vi.fn().mockRejectedValue(new Error("db down")) });
    const r = await handleManageLocations(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ extra_locations: 1, limit: 2, synced: false });
    expect(deps.log).toHaveBeenCalled();
  });
});
