import { describe, it, expect, vi } from "vitest";
import {
  ensureGym,
  gymNameFor,
  needsGymSetupRedirect,
  DEFAULT_GYM_NAME,
  type GymSetupClient,
} from "./ensureGym";

function makeClient(opts: {
  membership?: { tenant_id: string } | null;
  lookupError?: string;
  rpcResult?: string | null;
  rpcError?: string;
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: opts.rpcResult === undefined ? "new-tenant" : opts.rpcResult,
    error: opts.rpcError ? { message: opts.rpcError } : null,
  });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: opts.membership ?? null,
    error: opts.lookupError ? { message: opts.lookupError } : null,
  });
  const chain = { select: () => chain, eq: () => chain, order: () => chain, limit: () => chain, maybeSingle };
  const client = { from: () => chain, rpc } as unknown as GymSetupClient;
  return { client, rpc, maybeSingle };
}

const user = { id: "u1", user_metadata: { gym_name: "  Iron House  " } };

describe("gymNameFor", () => {
  it("uses the trimmed gym name from signup", () => {
    expect(gymNameFor(user)).toBe("Iron House");
  });
  it("falls back when the name is missing, blank or not a string", () => {
    expect(gymNameFor({ id: "u" })).toBe(DEFAULT_GYM_NAME);
    expect(gymNameFor({ id: "u", user_metadata: { gym_name: "   " } })).toBe(DEFAULT_GYM_NAME);
    expect(gymNameFor({ id: "u", user_metadata: { gym_name: 42 } })).toBe(DEFAULT_GYM_NAME);
  });
  it("caps an absurdly long name", () => {
    expect(gymNameFor({ id: "u", user_metadata: { gym_name: "x".repeat(500) } })).toHaveLength(120);
  });
});

describe("ensureGym", () => {
  it("reuses an existing membership without creating a second gym", async () => {
    const { client, rpc } = makeClient({ membership: { tenant_id: "t-existing" } });
    await expect(ensureGym(client, user)).resolves.toBe("t-existing");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("creates the gym as admin using the signup gym name", async () => {
    const { client, rpc } = makeClient({});
    await expect(ensureGym(client, user)).resolves.toBe("new-tenant");
    expect(rpc).toHaveBeenCalledWith("create_tenant_with_membership", {
      p_tenant_name: "Iron House",
      p_user_role: "admin",
      p_tenant_metadata: {},
    });
  });

  it("does not create a gym when the membership lookup itself failed", async () => {
    const { client, rpc } = makeClient({ lookupError: "network down" });
    await expect(ensureGym(client, user)).rejects.toThrow("network down");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("surfaces a create failure", async () => {
    const { client } = makeClient({ rpcResult: null, rpcError: "boom" });
    await expect(ensureGym(client, user)).rejects.toThrow("boom");
  });

  it("rejects when the create call returns no tenant id", async () => {
    const { client } = makeClient({ rpcResult: null });
    await expect(ensureGym(client, user)).rejects.toThrow(/No tenant ID/);
  });
});

describe("needsGymSetupRedirect", () => {
  it("leaves auth, welcome and legal pages alone", () => {
    for (const p of ["/", "/login", "/signup", "/welcome", "/reset-password", "/forgot-password", "/terms", "/privacy", "/refund"]) {
      expect(needsGymSetupRedirect(p)).toBe(false);
    }
  });
  it("sends app, checkout and onboarding pages to /welcome", () => {
    for (const p of ["/dashboard", "/members", "/subscribe", "/subscribe/callback", "/onboarding"]) {
      expect(needsGymSetupRedirect(p)).toBe(true);
    }
  });
});
