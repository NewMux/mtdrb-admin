import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleInvite, parseInput, type InviteDeps, type InviteRequest } from "./handler";

const ORIGIN = "https://app.example.com";

const goodBody = {
  gymName: "  Iron Temple ",
  adminEmail: "  Sara@IronTemple.example ",
  planTier: "pro",
  until: "2026-12-01T00:00:00.000Z",
  reason: "Founding customer",
};

function makeDeps(over: Partial<InviteDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    redirectTo: `${ORIGIN}/reset-password`,
    verify: vi.fn().mockResolvedValue({ status: "ok", userId: "owner-1" }),
    rateLimit: vi.fn().mockResolvedValue(true),
    invite: vi.fn().mockResolvedValue({ ok: true, userId: "new-user-1" }),
    provision: vi.fn().mockResolvedValue({ ok: true, tenantId: "tenant-1" }),
    removeUser: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & InviteDeps;
}

const req = (over: Partial<InviteRequest> = {}): InviteRequest => ({
  method: "POST",
  origin: ORIGIN,
  authorization: "Bearer good.jwt.token",
  bodyText: JSON.stringify(goodBody),
  ...over,
});
const json = (r: { body: string | null }) => JSON.parse(r.body ?? "null");

let deps: ReturnType<typeof makeDeps>;
beforeEach(() => {
  deps = makeDeps();
});

describe("CORS and request shape", () => {
  it("answers the preflight without needing a token", async () => {
    const r = await handleInvite(req({ method: "OPTIONS", authorization: null, bodyText: "" }), deps);
    expect(r.status).toBe(204);
    expect(r.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    expect(r.headers["Access-Control-Allow-Headers"]).toContain("authorization");
    expect(r.headers["Access-Control-Allow-Headers"]).toContain("x-application-name");
    expect(r.headers["Access-Control-Allow-Headers"]).toContain("prefer");
    expect(deps.verify).not.toHaveBeenCalled();
  });

  it("gives no CORS headers to an origin that is not allowed", async () => {
    const r = await handleInvite(req({ origin: "https://evil.example" }), deps);
    expect(r.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    const pre = await handleInvite(req({ method: "OPTIONS", origin: "https://evil.example" }), deps);
    expect(pre.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("refuses other methods and missing/odd tokens, and never calls anything", async () => {
    expect((await handleInvite(req({ method: "GET" }), deps)).status).toBe(405);
    expect((await handleInvite(req({ authorization: null }), deps)).status).toBe(401);
    expect((await handleInvite(req({ authorization: "Basic abc" }), deps)).status).toBe(401);
    expect((await handleInvite(req({ authorization: "Bearer " }), deps)).status).toBe(401);
    expect(deps.verify).not.toHaveBeenCalled();
    expect(deps.invite).not.toHaveBeenCalled();
  });
});

describe("only a verified platform admin gets any further", () => {
  it.each(["not_admin", "mfa_required", "weird"])("status %s => the same generic 403, nothing sent", async (status) => {
    deps.verify.mockResolvedValue({ status, userId: "u1" });
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(403);
    expect(json(r)).toEqual({ error: "You do not have access to this." });
    expect(deps.invite).not.toHaveBeenCalled();
    expect(deps.provision).not.toHaveBeenCalled();
    expect(deps.rateLimit).not.toHaveBeenCalled();
  });

  it("an unverifiable token, or no user id, is also a 403", async () => {
    deps.verify.mockRejectedValue(new Error("jwt expired"));
    expect((await handleInvite(req(), deps)).status).toBe(403);
    deps.verify.mockResolvedValue({ status: "ok", userId: null });
    expect((await handleInvite(req(), deps)).status).toBe(403);
    expect(deps.invite).not.toHaveBeenCalled();
  });

  it("does not even read the body for a non-admin (no validation oracle)", async () => {
    deps.verify.mockResolvedValue({ status: "not_admin", userId: "u1" });
    const r = await handleInvite(req({ bodyText: "not json" }), deps);
    expect(r.status).toBe(403);
  });
});

describe("input validation", () => {
  const bad = (patch: Record<string, unknown>) => handleInvite(req({ bodyText: JSON.stringify({ ...goodBody, ...patch }) }), deps);

  it.each([
    ["gym name missing", { gymName: "  " }],
    ["gym name too long", { gymName: "x".repeat(161) }],
    ["gym name with control characters", { gymName: "Gym\u0000" }],
    ["email without a domain", { adminEmail: "sara@" }],
    ["email with a space", { adminEmail: "sa ra@x.dev" }],
    ["email too long", { adminEmail: `${"a".repeat(250)}@x.dev` }],
    ["unknown plan", { planTier: "platinum" }],
    ["unparseable end date", { until: "tomorrow-ish" }],
    ["non-string end date", { until: 12345 }],
    ["short reason", { reason: "ab" }],
    ["long reason", { reason: "x".repeat(501) }],
  ])("%s => 400, and nothing is sent", async (_label, patch) => {
    const r = await bad(patch);
    expect(r.status).toBe(400);
    expect(deps.invite).not.toHaveBeenCalled();
  });

  it("rejects non-JSON and non-object bodies", async () => {
    expect((await handleInvite(req({ bodyText: "{oops" }), deps)).status).toBe(400);
    expect((await handleInvite(req({ bodyText: "[1,2]" }), deps)).status).toBe(400);
    expect((await handleInvite(req({ bodyText: "null" }), deps)).status).toBe(400);
  });

  it("rejects an oversized body", async () => {
    expect((await handleInvite(req({ bodyText: " ".repeat(10_001) }), deps)).status).toBe(413);
  });

  it("normalises the input it passes on", () => {
    const parsed = parseInput(goodBody);
    expect(parsed).toEqual({
      ok: true,
      input: {
        gymName: "Iron Temple",
        adminEmail: "sara@irontemple.example",
        planTier: "pro",
        until: "2026-12-01T00:00:00.000Z",
        reason: "Founding customer",
      },
    });
    expect(parseInput({ ...goodBody, until: null })).toMatchObject({ ok: true, input: { until: null } });
    expect(parseInput({ ...goodBody, until: undefined })).toMatchObject({ ok: true, input: { until: null } });
  });
});

describe("rate limit", () => {
  it("returns 429 per caller before sending anything", async () => {
    deps.rateLimit.mockResolvedValue(false);
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(429);
    expect(deps.rateLimit).toHaveBeenCalledWith("platform-invite-gym:owner-1");
    expect(deps.invite).not.toHaveBeenCalled();
  });

  it("does not block a verified owner when the limiter itself breaks", async () => {
    deps.rateLimit.mockRejectedValue(new Error("db down"));
    expect((await handleInvite(req(), deps)).status).toBe(200);
    expect(deps.log).toHaveBeenCalled();
  });
});

describe("the happy path", () => {
  it("invites, then provisions with the CALLER's token, and returns the ids", async () => {
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r)).toEqual({ tenantId: "tenant-1", userId: "new-user-1", email: "sara@irontemple.example" });
    expect(deps.invite).toHaveBeenCalledWith("sara@irontemple.example", `${ORIGIN}/reset-password`, "Iron Temple");
    expect(deps.provision).toHaveBeenCalledWith("good.jwt.token", {
      gymName: "Iron Temple",
      adminEmail: "sara@irontemple.example",
      planTier: "pro",
      until: "2026-12-01T00:00:00.000Z",
      reason: "Founding customer",
      userId: "new-user-1",
    });
    expect(deps.removeUser).not.toHaveBeenCalled();
    expect(r.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
  });

  it("invites strictly before provisioning", async () => {
    const order: string[] = [];
    deps.invite.mockImplementation(async () => (order.push("invite"), { ok: true, userId: "u" }));
    deps.provision.mockImplementation(async () => (order.push("provision"), { ok: true, tenantId: "t" }));
    await handleInvite(req(), deps);
    expect(order).toEqual(["invite", "provision"]);
  });

  it("refuses to send an invitation with no landing page configured", async () => {
    deps = makeDeps({ redirectTo: null });
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(500);
    expect(deps.invite).not.toHaveBeenCalled();
  });
});

describe("failures", () => {
  it("an existing account is a clear 409 and nothing is provisioned or deleted", async () => {
    deps.invite.mockResolvedValue({ ok: false, code: "already_registered" });
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(409);
    expect(json(r).error).toMatch(/already has an account/);
    expect(deps.provision).not.toHaveBeenCalled();
    expect(deps.removeUser).not.toHaveBeenCalled(); // never touch an account we did not create
  });

  it("a failed or throwing invite is a 502 with nothing to undo", async () => {
    deps.invite.mockResolvedValue({ ok: false, code: "failed" });
    expect((await handleInvite(req(), deps)).status).toBe(502);
    deps.invite.mockRejectedValue(new Error("smtp down"));
    expect((await handleInvite(req(), deps)).status).toBe(502);
    expect(deps.provision).not.toHaveBeenCalled();
    expect(deps.removeUser).not.toHaveBeenCalled();
  });

  it("a refused provision deletes the account the invite created and passes the database's message on", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "22023", message: "A gym name of 1 to 160 characters is required" });
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(400);
    expect(json(r).error).toBe("A gym name of 1 to 160 characters is required");
    expect(deps.removeUser).toHaveBeenCalledWith("new-user-1");

    deps.provision.mockResolvedValue({ ok: false, code: "55000", message: "This account is not a pending invitation" });
    expect((await handleInvite(req(), deps)).status).toBe(409);
  });

  it("a forbidden provision is a generic 403 and still cleans up", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "42501", message: "forbidden" });
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(403);
    expect(json(r)).toEqual({ error: "You do not have access to this." });
    expect(deps.removeUser).toHaveBeenCalledWith("new-user-1");
  });

  it("an unexpected database error is a generic 500 that does not leak details", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "XX000", message: 'relation "secret_table" does not exist' });
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(500);
    expect(r.body).not.toContain("secret_table");
    expect(deps.removeUser).toHaveBeenCalledWith("new-user-1");
  });

  it("a throwing provision is cleaned up the same way", async () => {
    deps.provision.mockRejectedValue(new Error("network"));
    expect((await handleInvite(req(), deps)).status).toBe(500);
    expect(deps.removeUser).toHaveBeenCalledWith("new-user-1");
  });

  it("if cleanup itself fails, it is logged loudly and the caller still gets the original error", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "22023", message: "bad" });
    deps.removeUser.mockRejectedValue(new Error("delete failed"));
    const r = await handleInvite(req(), deps);
    expect(r.status).toBe(400);
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("new-user-1"), expect.any(Error));
  });
});
