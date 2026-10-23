import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleInviteStaff, parseInput, type InviteStaffDeps, type InviteStaffRequest } from "./handler";

const ORIGIN = "https://app.example.com";
const ROLE_ID = "11111111-2222-4333-8444-555555555555";

const goodBody = { email: "  Sara@Gym.example ", role: "employee" };

function makeDeps(over: Partial<InviteStaffDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    redirectTo: `${ORIGIN}/reset-password`,
    verify: vi.fn().mockResolvedValue({ tenantId: "tenant-1", staffCount: 3 }),
    rateLimit: vi.fn().mockResolvedValue(true),
    invite: vi.fn().mockResolvedValue({ ok: true, userId: "new-user-1" }),
    provision: vi.fn().mockResolvedValue({ ok: true }),
    removeUser: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & InviteStaffDeps;
}

const req = (over: Partial<InviteStaffRequest> = {}): InviteStaffRequest => ({
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

describe("transport", () => {
  it("answers a CORS preflight for an allowed origin only", async () => {
    const ok = await handleInviteStaff(req({ method: "OPTIONS", authorization: null }), deps);
    expect(ok.status).toBe(204);
    expect(ok.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    const bad = await handleInviteStaff(req({ method: "OPTIONS", origin: "https://evil.example", authorization: null }), deps);
    expect(bad.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(deps.verify).not.toHaveBeenCalled();
  });

  it("refuses other methods and missing or malformed tokens", async () => {
    expect((await handleInviteStaff(req({ method: "GET" }), deps)).status).toBe(405);
    expect((await handleInviteStaff(req({ authorization: null }), deps)).status).toBe(401);
    expect((await handleInviteStaff(req({ authorization: "Basic abc" }), deps)).status).toBe(401);
    expect(deps.invite).not.toHaveBeenCalled();
  });
});

describe("who may invite", () => {
  it("refuses anyone who is not a gym admin, with a generic message, before reading the body", async () => {
    deps.verify.mockResolvedValue(null);
    const res = await handleInviteStaff(req({ bodyText: "not json" }), deps);
    expect(res.status).toBe(403);
    expect(json(res).error).toBe("You do not have access to this.");
    expect(deps.invite).not.toHaveBeenCalled();
    expect(deps.rateLimit).not.toHaveBeenCalled();
  });

  it("treats a verification error the same as a refusal", async () => {
    deps.verify.mockRejectedValue(new Error("db down"));
    expect((await handleInviteStaff(req(), deps)).status).toBe(403);
    expect(deps.invite).not.toHaveBeenCalled();
  });

  it("uses the gym from the verified token, never one named in the body", async () => {
    await handleInviteStaff(req({ bodyText: JSON.stringify({ ...goodBody, tenantId: "someone-elses", tenant_id: "x" }) }), deps);
    expect(deps.provision).toHaveBeenCalledWith("tenant-1", "new-user-1", expect.not.objectContaining({ tenantId: expect.anything() }));
    expect(deps.rateLimit).toHaveBeenCalledWith("invite-staff:tenant-1");
  });
});

describe("input", () => {
  it("normalises the email and starts on a built-in role", () => {
    expect(parseInput(goodBody)).toEqual({ ok: true, input: { email: "sara@gym.example", role: "employee", customRoleId: null } });
    expect(parseInput({ email: "a@b.co", role: "trainer" })).toMatchObject({ ok: true, input: { role: "trainer" } });
  });

  it("accepts a custom role id in place of a built-in role", () => {
    expect(parseInput({ email: "a@b.co", customRoleId: ROLE_ID.toUpperCase() })).toEqual({
      ok: true,
      input: { email: "a@b.co", role: "employee", customRoleId: ROLE_ID },
    });
  });

  it("never offers admin", () => {
    expect(parseInput({ email: "a@b.co", role: "admin" })).toMatchObject({ ok: false });
    expect(parseInput({ email: "a@b.co", role: "superadmin" })).toMatchObject({ ok: false });
    expect(parseInput({ email: "a@b.co" })).toMatchObject({ ok: false });
  });

  it("rejects bad shapes", () => {
    for (const bad of [null, "x", [], { email: "nope", role: "employee" }, { email: `${"a".repeat(250)}@b.co`, role: "employee" },
      { email: "a@b.co", customRoleId: "not-a-uuid" }, { email: "a@b.co", customRoleId: 5 }]) {
      expect(parseInput(bad)).toMatchObject({ ok: false });
    }
  });

  it("answers 400 for invalid JSON or input, and 413 for a huge body", async () => {
    expect((await handleInviteStaff(req({ bodyText: "{" }), deps)).status).toBe(400);
    expect((await handleInviteStaff(req({ bodyText: JSON.stringify({ email: "x" }) }), deps)).status).toBe(400);
    expect((await handleInviteStaff(req({ bodyText: "x".repeat(5000) }), deps)).status).toBe(413);
    expect(deps.invite).not.toHaveBeenCalled();
  });
});

describe("limits", () => {
  it("refuses at the staff cap before sending anything", async () => {
    deps.verify.mockResolvedValue({ tenantId: "tenant-1", staffCount: 50 });
    const res = await handleInviteStaff(req(), deps);
    expect(res.status).toBe(409);
    expect(deps.invite).not.toHaveBeenCalled();
  });

  it("rate-limits per gym, but a broken limiter does not block an admin", async () => {
    deps.rateLimit.mockResolvedValue(false);
    expect((await handleInviteStaff(req(), deps)).status).toBe(429);
    expect(deps.invite).not.toHaveBeenCalled();
    deps = makeDeps({ rateLimit: vi.fn().mockRejectedValue(new Error("limiter down")) });
    expect((await handleInviteStaff(req(), deps)).status).toBe(200);
  });

  it("refuses to send an invitation with nowhere to land", async () => {
    deps = makeDeps({ redirectTo: null });
    expect((await handleInviteStaff(req(), deps)).status).toBe(500);
    expect(deps.invite).not.toHaveBeenCalled();
  });
});

describe("the invitation", () => {
  it("invites, adds them to the gym, and reports who", async () => {
    const res = await handleInviteStaff(req(), deps);
    expect(res.status).toBe(200);
    expect(json(res)).toEqual({ userId: "new-user-1", email: "sara@gym.example" });
    expect(deps.invite).toHaveBeenCalledWith("sara@gym.example", `${ORIGIN}/reset-password`);
    expect(deps.provision).toHaveBeenCalledWith("tenant-1", "new-user-1", { email: "sara@gym.example", role: "employee", customRoleId: null });
    expect(deps.removeUser).not.toHaveBeenCalled();
  });

  it("says so when the email already has an account, and adds nobody", async () => {
    deps.invite.mockResolvedValue({ ok: false, code: "already_registered" });
    const res = await handleInviteStaff(req(), deps);
    expect(res.status).toBe(409);
    expect(json(res).error).toMatch(/already has an account/);
    expect(deps.provision).not.toHaveBeenCalled();
  });

  it("reports a failed email as a gateway error and adds nobody", async () => {
    deps.invite.mockResolvedValue({ ok: false, code: "failed" });
    expect((await handleInviteStaff(req(), deps)).status).toBe(502);
    deps.invite.mockRejectedValue(new Error("smtp"));
    expect((await handleInviteStaff(req(), deps)).status).toBe(502);
    expect(deps.provision).not.toHaveBeenCalled();
  });

  it("removes the invited account again when adding them fails", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "55000", message: "That person already belongs to a gym" });
    const res = await handleInviteStaff(req(), deps);
    expect(res.status).toBe(409);
    expect(json(res).error).toBe("That person already belongs to a gym");
    expect(deps.removeUser).toHaveBeenCalledWith("new-user-1");
  });

  it("maps a missing role to 404 and hides unexpected database errors", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "P0002", message: "Role not found" });
    expect((await handleInviteStaff(req(), deps)).status).toBe(404);
    deps.provision.mockResolvedValue({ ok: false, code: "XX000", message: "internal: secret detail" });
    const res = await handleInviteStaff(req(), deps);
    expect(res.status).toBe(500);
    expect(res.body).not.toMatch(/secret/);
    deps.provision.mockRejectedValue(new Error("boom"));
    expect((await handleInviteStaff(req(), deps)).status).toBe(500);
    expect(deps.removeUser).toHaveBeenCalledTimes(3);
  });

  it("still answers when the cleanup itself fails, and logs it", async () => {
    deps.provision.mockResolvedValue({ ok: false, code: "22023", message: "Invited staff start as employee or trainer" });
    deps.removeUser.mockRejectedValue(new Error("cannot delete"));
    const res = await handleInviteStaff(req(), deps);
    expect(res.status).toBe(400);
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("could not remove invited user new-user-1"), expect.anything());
  });
});
