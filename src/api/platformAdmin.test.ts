import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("../supabaseClient", () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }));

import {
  addNote,
  fetchOverview,
  fetchPlatformAdminStatus,
  fetchTenantDetail,
  grantAccess,
  listTenants,
  PlatformAdminError,
  revokeAccess,
} from "./platformAdmin";

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const fail = (message: string, code?: string) =>
  Promise.resolve({ data: null, error: { message, code } });

beforeEach(() => rpc.mockReset());

describe("fetchPlatformAdminStatus", () => {
  it("returns ok / mfa_required / not_admin as documented", async () => {
    rpc.mockReturnValueOnce(ok("ok"));
    expect(await fetchPlatformAdminStatus()).toBe("ok");
    rpc.mockReturnValueOnce(ok("mfa_required"));
    expect(await fetchPlatformAdminStatus()).toBe("mfa_required");
    rpc.mockReturnValueOnce(ok("not_admin"));
    expect(await fetchPlatformAdminStatus()).toBe("not_admin");
    expect(rpc).toHaveBeenCalledWith("platform_admin_status", undefined);
  });

  it("never treats the mock client's fallback object as an admin", async () => {
    rpc.mockReturnValueOnce(ok({ total_members: 248, active_members: 210 }));
    expect(await fetchPlatformAdminStatus()).toBe("not_admin");
  });

  it("throws on a transport error so the guard can show a retry (not children, not a 404)", async () => {
    rpc.mockReturnValueOnce(fail("network down"));
    await expect(fetchPlatformAdminStatus()).rejects.toBeInstanceOf(PlatformAdminError);
  });
});

describe("response validation", () => {
  it("rejects a payload of the wrong shape", async () => {
    rpc.mockReturnValueOnce(ok({ total_members: 1 }));
    await expect(fetchOverview()).rejects.toThrow(/unexpected response/i);
    rpc.mockReturnValueOnce(ok("nope"));
    await expect(listTenants()).rejects.toThrow(/unexpected response/i);
    rpc.mockReturnValueOnce(ok({ total: 1, rows: "x" }));
    await expect(listTenants()).rejects.toThrow(/unexpected response/i);
    rpc.mockReturnValueOnce(ok(null));
    await expect(fetchTenantDetail("t1")).rejects.toThrow(/unexpected response/i);
  });

  it("maps the generic database denial to a friendly message", async () => {
    rpc.mockReturnValueOnce(fail("forbidden", "42501"));
    await expect(fetchOverview()).rejects.toThrow("You do not have access to this.");
  });
});

describe("request shaping", () => {
  it("sends list parameters with defaults and trims the search", async () => {
    rpc.mockReturnValueOnce(ok({ total: 0, rows: [] }));
    await listTenants({ search: "  iron ", filter: "paid", offset: 25 });
    expect(rpc).toHaveBeenCalledWith("platform_list_tenants", {
      p_search: "iron",
      p_filter: "paid",
      p_sort: "created_desc",
      p_limit: 25,
      p_offset: 25,
    });
  });

  it("sends a null search when blank", async () => {
    rpc.mockReturnValueOnce(ok({ total: 0, rows: [] }));
    await listTenants({ search: "   " });
    expect(rpc.mock.calls[0][1].p_search).toBeNull();
  });

  it("passes grant parameters straight through, with a null end date for no expiry", async () => {
    rpc.mockReturnValueOnce(ok({}));
    await grantAccess({ tenantId: "t1", planTier: "pro", until: null, reason: "  pilot " });
    expect(rpc).toHaveBeenCalledWith("platform_grant_access", {
      p_tenant_id: "t1",
      p_plan_tier: "pro",
      p_until: null,
      p_reason: "pilot",
    });
  });

  it("surfaces the database's refusal message for a Paddle-managed gym", async () => {
    rpc.mockReturnValueOnce(fail("This gym is billed through Paddle.", "55000"));
    await expect(
      grantAccess({ tenantId: "t1", planTier: "pro", until: null, reason: "x y z" }),
    ).rejects.toThrow("billed through Paddle");
  });

  it("revoke and note use their own RPCs", async () => {
    rpc.mockReturnValue(ok({}));
    await revokeAccess("t1", " done ");
    await addNote("t1", " hello ");
    expect(rpc).toHaveBeenCalledWith("platform_revoke_access", { p_tenant_id: "t1", p_reason: "done" });
    expect(rpc).toHaveBeenCalledWith("platform_add_note", { p_tenant_id: "t1", p_note: "hello" });
  });
});
