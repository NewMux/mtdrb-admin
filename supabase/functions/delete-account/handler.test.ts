import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDeleteAccount, parseBody, type Caller, type DeleteDeps, type DeleteRequest } from "./handler";

const ORIGIN = "https://app.example.com";

const admin: Caller = {
  user_id: "user-1",
  email: "owner@gym.test",
  tenant_id: "tenant-1",
  tenant_name: "Iron House",
  is_admin: true,
  is_platform_admin: false,
};
const staff: Caller = { ...admin, user_id: "user-2", email: "Staff@Gym.test", is_admin: false };
const noGym: Caller = { ...admin, user_id: "user-3", tenant_id: null, tenant_name: null, is_admin: false };

const paddleSub = { status: "active", payment_provider: "paddle", payment_reference: "sub_1" };

function makeDeps(over: Partial<DeleteDeps> = {}) {
  const deps = {
    allowedOrigins: [ORIGIN],
    paddleConfigured: true,
    getCaller: vi.fn().mockResolvedValue(admin),
    loadSubscription: vi.fn().mockResolvedValue(paddleSub),
    rateLimit: vi.fn().mockResolvedValue(true),
    cancelNow: vi.fn().mockResolvedValue({ ok: true }),
    deleteGym: vi.fn().mockResolvedValue({ ok: true, deletedUsers: 3 }),
    deleteUser: vi.fn().mockResolvedValue({ ok: true, deletedUsers: 1 }),
    removeFiles: vi.fn().mockResolvedValue(true),
    log: vi.fn(),
    ...over,
  };
  return deps as typeof deps & DeleteDeps;
}

const req = (body: unknown = { scope: "gym", confirm: "Iron House" }, over: Partial<DeleteRequest> = {}): DeleteRequest => ({
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

describe("parseBody", () => {
  it("needs a known scope and a non-empty confirmation", () => {
    expect(parseBody({ scope: "gym", confirm: "  Iron House " })).toEqual({ scope: "gym", confirm: "Iron House" });
    expect(parseBody({ scope: "me", confirm: "a@b.c" })).toEqual({ scope: "me", confirm: "a@b.c" });
    expect(parseBody({ scope: "all", confirm: "x" })).toBeNull();
    expect(parseBody({ scope: "gym" })).toBeNull();
    expect(parseBody({ scope: "gym", confirm: "   " })).toBeNull();
    expect(parseBody({ scope: "gym", confirm: "x".repeat(301) })).toBeNull();
    expect(parseBody(null)).toBeNull();
    expect(parseBody([])).toBeNull();
  });
});

describe("request gates", () => {
  it("answers the CORS preflight without checking anything", async () => {
    const r = await handleDeleteAccount(req({}, { method: "OPTIONS", authorization: null }), deps);
    expect(r.status).toBe(204);
    expect(r.headers["Access-Control-Allow-Origin"]).toBe(ORIGIN);
    expect(deps.getCaller).not.toHaveBeenCalled();
  });

  it("refuses other methods, a missing token, and an unknown caller", async () => {
    expect((await handleDeleteAccount(req({}, { method: "GET" }), deps)).status).toBe(405);
    expect((await handleDeleteAccount(req({}, { authorization: null }), deps)).status).toBe(401);
    deps.getCaller.mockResolvedValueOnce(null);
    expect((await handleDeleteAccount(req(), deps)).status).toBe(401);
    deps.getCaller.mockRejectedValueOnce(new Error("db down"));
    expect((await handleDeleteAccount(req(), deps)).status).toBe(401);
    expect(deps.deleteGym).not.toHaveBeenCalled();
  });

  it("never deletes a platform owner's account", async () => {
    deps.getCaller.mockResolvedValue({ ...admin, is_platform_admin: true });
    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(403);
    expect(deps.cancelNow).not.toHaveBeenCalled();
    expect(deps.deleteGym).not.toHaveBeenCalled();
  });

  it("rejects bad bodies", async () => {
    expect((await handleDeleteAccount(req({ scope: "gym" }), deps)).status).toBe(400);
    expect((await handleDeleteAccount(req({}, { bodyText: "{nope" }), deps)).status).toBe(400);
    expect((await handleDeleteAccount(req({}, { bodyText: "x".repeat(2001) }), deps)).status).toBe(413);
  });
});

describe("scope and confirmation", () => {
  it("only the gym's admin can delete the gym", async () => {
    deps.getCaller.mockResolvedValue(staff);
    expect((await handleDeleteAccount(req(), deps)).status).toBe(403);
    deps.getCaller.mockResolvedValue(noGym);
    expect((await handleDeleteAccount(req(), deps)).status).toBe(403);
    expect(deps.deleteGym).not.toHaveBeenCalled();
  });

  it("the gym name must be typed exactly", async () => {
    const r = await handleDeleteAccount(req({ scope: "gym", confirm: "iron house" }), deps);
    expect(r.status).toBe(400);
    expect(deps.cancelNow).not.toHaveBeenCalled();
    expect(deps.deleteGym).not.toHaveBeenCalled();
  });

  it("an admin cannot use 'me' to leave their gym behind", async () => {
    const r = await handleDeleteAccount(req({ scope: "me", confirm: "owner@gym.test" }), deps);
    expect(r.status).toBe(409);
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it("'me' needs the account's own email (case-insensitive)", async () => {
    deps.getCaller.mockResolvedValue(staff);
    expect((await handleDeleteAccount(req({ scope: "me", confirm: "other@gym.test" }), deps)).status).toBe(400);
    const ok = await handleDeleteAccount(req({ scope: "me", confirm: "staff@gym.test" }), deps);
    expect(ok.status).toBe(200);
    expect(deps.deleteUser).toHaveBeenCalledWith("user-2", "staff@gym.test");
  });

  it("an account with no gym can delete itself", async () => {
    deps.getCaller.mockResolvedValue(noGym);
    const r = await handleDeleteAccount(req({ scope: "me", confirm: "owner@gym.test" }), deps);
    expect(r.status).toBe(200);
    expect(deps.removeFiles).not.toHaveBeenCalled();
  });

  it("is rate limited per person", async () => {
    deps.rateLimit.mockResolvedValue(false);
    expect((await handleDeleteAccount(req(), deps)).status).toBe(429);
    expect(deps.rateLimit).toHaveBeenCalledWith("delete-account:user-1");
    expect(deps.deleteGym).not.toHaveBeenCalled();
  });

  it("a broken limiter does not block erasing your data", async () => {
    deps.rateLimit.mockRejectedValue(new Error("limiter down"));
    expect((await handleDeleteAccount(req(), deps)).status).toBe(200);
  });
});

describe("deleting a gym", () => {
  it("cancels a live Paddle subscription first, then deletes, then removes files", async () => {
    const order: string[] = [];
    deps.cancelNow.mockImplementation(async () => (order.push("cancel"), { ok: true }));
    deps.deleteGym.mockImplementation(async () => (order.push("delete"), { ok: true, deletedUsers: 3 }));
    deps.removeFiles.mockImplementation(async () => (order.push("files"), true));

    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(200);
    expect(order).toEqual(["cancel", "delete", "files"]);
    expect(deps.cancelNow).toHaveBeenCalledWith("sub_1");
    expect(deps.deleteGym).toHaveBeenCalledWith("user-1", "Iron House", true);
    expect(deps.removeFiles).toHaveBeenCalledWith("tenant-1");
    expect(json(r)).toEqual({ deleted: true, scope: "gym", deleted_users: 3, files_removed: true, subscription_cancelled: true });
  });

  it("deletes nothing if Paddle will not cancel", async () => {
    deps.cancelNow.mockResolvedValue({ ok: false, status: 500, detail: "{}" });
    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(502);
    expect(deps.deleteGym).not.toHaveBeenCalled();
    expect(deps.removeFiles).not.toHaveBeenCalled();
  });

  it("refuses when billing is not configured but a subscription is live", async () => {
    deps = makeDeps({ paddleConfigured: false });
    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(503);
    expect(deps.deleteGym).not.toHaveBeenCalled();
  });

  it("skips Paddle when there is no live subscription", async () => {
    for (const sub of [null, { ...paddleSub, status: "cancelled" }, { ...paddleSub, payment_provider: "manual" }, { ...paddleSub, payment_reference: null }]) {
      deps = makeDeps({ loadSubscription: vi.fn().mockResolvedValue(sub) });
      const r = await handleDeleteAccount(req(), deps);
      expect(r.status).toBe(200);
      expect(deps.cancelNow).not.toHaveBeenCalled();
      expect(deps.deleteGym).toHaveBeenCalledWith("user-1", "Iron House", false);
    }
  });

  it("works for a gym with no Paddle configuration at all if it has no live subscription", async () => {
    deps = makeDeps({ paddleConfigured: false, loadSubscription: vi.fn().mockResolvedValue(null) });
    expect((await handleDeleteAccount(req(), deps)).status).toBe(200);
  });

  it("reports the database's refusal in plain words", async () => {
    deps.deleteGym.mockResolvedValue({ ok: false, code: "55000", message: "A gym that contains a platform admin cannot be deleted" });
    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(409);
    expect(json(r).error).toMatch(/platform admin/);
    expect(deps.removeFiles).not.toHaveBeenCalled();
  });

  it("does not claim success when the database call throws", async () => {
    deps.deleteGym.mockRejectedValue(new Error("boom"));
    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(500);
    expect(json(r).error).toMatch(/not deleted/);
  });

  it("still succeeds, and says so, when some files could not be removed", async () => {
    deps.removeFiles.mockResolvedValue(false);
    expect(json(await handleDeleteAccount(req(), deps)).files_removed).toBe(false);
    deps.removeFiles.mockRejectedValue(new Error("storage down"));
    const r = await handleDeleteAccount(req(), deps);
    expect(r.status).toBe(200);
    expect(json(r).files_removed).toBe(false);
  });
});
