import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleCancelSubscription, parseAction, type CancelDeps, type CancelRequest } from "./handler";

const ORIGIN = "https://app.example.com";
const END = "2026-11-20T10:00:00.000Z";

const caller = { tenant_id: "tenant-1", is_admin: true };
const sub = {
  status: "active",
  payment_provider: "paddle",
  payment_reference: "sub_1",
  cancel_at: null as string | null,
  current_period_end: END,
};

// What Paddle returns for a subscription with a cancellation scheduled.
const scheduled = { status: "active", next_billed_at: END, scheduled_change: { action: "cancel", effective_at: END, resume_at: null } };
const unscheduled = { status: "active", next_billed_at: END, scheduled_change: null };

function makeDeps(over: Partial<CancelDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    paddleConfigured: true,
    getCaller: vi.fn().mockResolvedValue(caller),
    loadSubscription: vi.fn().mockResolvedValue(sub),
    rateLimit: vi.fn().mockResolvedValue(true),
    scheduleCancel: vi.fn().mockResolvedValue({ ok: true, subscription: scheduled }),
    removeScheduledCancel: vi.fn().mockResolvedValue({ ok: true, subscription: unscheduled }),
    saveCancelAt: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & CancelDeps;
}

const req = (over: Partial<CancelRequest> = {}, body: unknown = { action: "cancel" }): CancelRequest => ({
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
  it("accepts cancel and resume only", () => {
    expect(parseAction({ action: "cancel" })).toBe("cancel");
    expect(parseAction({ action: "resume" })).toBe("resume");
    expect(parseAction({ action: "cancel_now" })).toBeNull();
    expect(parseAction({ action: "immediately" })).toBeNull();
    expect(parseAction({})).toBeNull();
    expect(parseAction(null)).toBeNull();
    expect(parseAction(["cancel"])).toBeNull();
    expect(parseAction("cancel")).toBeNull();
  });
});

describe("CORS and request shape", () => {
  it("answers the preflight without a token, and only for allowed origins", async () => {
    const ok = await handleCancelSubscription(req({ method: "OPTIONS", authorization: null, bodyText: "" }), deps);
    expect(ok.status).toBe(204);
    expect(ok.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    const bad = await handleCancelSubscription(req({ method: "OPTIONS", origin: "https://evil.example" }), deps);
    expect(bad.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("refuses other methods and a missing/odd token without calling anything", async () => {
    expect((await handleCancelSubscription(req({ method: "GET" }), deps)).status).toBe(405);
    expect((await handleCancelSubscription(req({ authorization: null }), deps)).status).toBe(401);
    expect((await handleCancelSubscription(req({ authorization: "Basic x" }), deps)).status).toBe(401);
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("400 for bad JSON or an unknown action, 413 for a huge body, before any billing call", async () => {
    expect((await handleCancelSubscription(req({ bodyText: "{nope" }), deps)).status).toBe(400);
    expect((await handleCancelSubscription(req({}, { action: "cancel_now" }), deps)).status).toBe(400);
    expect((await handleCancelSubscription(req({ bodyText: " ".repeat(2000) }), deps)).status).toBe(413);
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
  });
});

describe("who may call it", () => {
  it("401 when the token does not resolve to a gym or resolving throws", async () => {
    deps = makeDeps({ getCaller: vi.fn().mockResolvedValue(null) });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(401);
    deps = makeDeps({ getCaller: vi.fn().mockRejectedValue(new Error("JWT expired")) });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(401);
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
  });

  it("403 for a signed-in member who is not an admin, before anything else is looked at", async () => {
    deps = makeDeps({ getCaller: vi.fn().mockResolvedValue({ ...caller, is_admin: false }) });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(403);
    expect(deps.loadSubscription).not.toHaveBeenCalled();
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
  });

  it("acts on the caller's own gym whatever the body says", async () => {
    await handleCancelSubscription(req({}, { action: "cancel", tenant_id: "someone-else" }), deps);
    expect(deps.loadSubscription).toHaveBeenCalledWith("tenant-1");
    expect(deps.saveCancelAt).toHaveBeenCalledWith("tenant-1", expect.anything());
  });

  it("429 when rate limited, and carries on if the limiter itself is down", async () => {
    deps = makeDeps({ rateLimit: vi.fn().mockResolvedValue(false) });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(429);
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
    deps = makeDeps({ rateLimit: vi.fn().mockRejectedValue(new Error("db down")) });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(200);
  });
});

describe("which subscriptions can be cancelled here", () => {
  it.each([
    ["no subscription row", null],
    ["a manual grant", { ...sub, payment_provider: "manual", payment_reference: null }],
    ["a missing Paddle reference", { ...sub, payment_reference: null }],
  ])("409 for %s, with no Paddle call", async (_label, stored) => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue(stored) });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(409);
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
    expect(deps.saveCancelAt).not.toHaveBeenCalled();
  });

  it.each([["cancelled"], ["failed"], ["expired"], ["trialing"]])("409 when the status is %s", async (status) => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...sub, status }) });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(409);
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
  });

  it("a gym whose payment failed (past_due) can still cancel to stop the retries", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...sub, status: "past_due" }) });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(200);
    expect(deps.scheduleCancel).toHaveBeenCalledWith("sub_1");
  });

  it("500 when the subscription cannot be loaded", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockRejectedValue(new Error("db")) });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(500);
  });

  it("503 when billing is not configured", async () => {
    deps = makeDeps({ paddleConfigured: false });
    expect((await handleCancelSubscription(req(), deps)).status).toBe(503);
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
  });
});

describe("cancel", () => {
  it("schedules the cancellation in Paddle for the end of the period and records the date it reports", async () => {
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(200);
    expect(deps.scheduleCancel).toHaveBeenCalledWith("sub_1");
    expect(deps.saveCancelAt).toHaveBeenCalledWith("tenant-1", { cancelAt: END, currentPeriodEnd: END });
    expect(json(r)).toEqual({ cancel_at: END, synced: true });
  });

  it("never touches the row's status: the webhook flips it when the period ends", async () => {
    await handleCancelSubscription(req(), deps);
    const change = deps.saveCancelAt.mock.calls[0][1];
    expect(Object.keys(change).sort()).toEqual(["cancelAt", "currentPeriodEnd"]);
  });

  it("uses the stored period end if Paddle's answer omits the schedule", async () => {
    deps = makeDeps({ scheduleCancel: vi.fn().mockResolvedValue({ ok: true, subscription: { status: "active" } }) });
    const r = await handleCancelSubscription(req(), deps);
    expect(json(r)).toEqual({ cancel_at: END, synced: true });
    expect(deps.saveCancelAt).toHaveBeenCalledWith("tenant-1", { cancelAt: END, currentPeriodEnd: null });
  });

  it("reports synced:false when Paddle accepted but no end date is known anywhere", async () => {
    deps = makeDeps({
      loadSubscription: vi.fn().mockResolvedValue({ ...sub, current_period_end: null }),
      scheduleCancel: vi.fn().mockResolvedValue({ ok: true, subscription: { status: "active" } }),
    });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ cancel_at: null, synced: false });
    expect(deps.log).toHaveBeenCalled();
  });

  it("is idempotent: already cancelling means success with no Paddle call", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...sub, cancel_at: END }) });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ cancel_at: END, synced: true });
    expect(deps.scheduleCancel).not.toHaveBeenCalled();
    expect(deps.saveCancelAt).not.toHaveBeenCalled();
  });

  it("records nothing and says so when Paddle refuses", async () => {
    deps = makeDeps({ scheduleCancel: vi.fn().mockResolvedValue({ ok: false, status: 400, detail: '{"code":"subscription_locked"}' }) });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(502);
    expect(json(r).error).toContain("nothing was changed");
    expect(deps.saveCancelAt).not.toHaveBeenCalled();
  });

  it("still reports success (synced:false) if Paddle accepted but the database write failed", async () => {
    deps = makeDeps({ saveCancelAt: vi.fn().mockRejectedValue(new Error("db down")) });
    const r = await handleCancelSubscription(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ cancel_at: END, synced: false });
    expect(deps.log).toHaveBeenCalled();
  });
});

describe("resume (keep my subscription)", () => {
  const cancelling = { ...sub, cancel_at: END };
  const resumeReq = () => req({}, { action: "resume" });

  it("removes the scheduled cancellation in Paddle, then clears cancel_at", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue(cancelling) });
    const r = await handleCancelSubscription(resumeReq(), deps);
    expect(r.status).toBe(200);
    expect(deps.removeScheduledCancel).toHaveBeenCalledWith("sub_1");
    expect(deps.saveCancelAt).toHaveBeenCalledWith("tenant-1", { cancelAt: null, currentPeriodEnd: END });
    expect(json(r)).toEqual({ cancel_at: null, synced: true });
  });

  it("is idempotent: nothing scheduled means success with no Paddle call", async () => {
    const r = await handleCancelSubscription(resumeReq(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ cancel_at: null, synced: true });
    expect(deps.removeScheduledCancel).not.toHaveBeenCalled();
  });

  it("keeps the cancellation recorded when Paddle refuses (e.g. the period already ended)", async () => {
    deps = makeDeps({
      loadSubscription: vi.fn().mockResolvedValue(cancelling),
      removeScheduledCancel: vi.fn().mockResolvedValue({ ok: false, status: 409, detail: "{}" }),
    });
    const r = await handleCancelSubscription(resumeReq(), deps);
    expect(r.status).toBe(502);
    expect(deps.saveCancelAt).not.toHaveBeenCalled();
  });

  it("cannot resume a subscription that has already ended", async () => {
    deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue({ ...cancelling, status: "cancelled" }) });
    const r = await handleCancelSubscription(resumeReq(), deps);
    expect(r.status).toBe(409);
    expect(deps.removeScheduledCancel).not.toHaveBeenCalled();
  });
});
