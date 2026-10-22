import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const invoke = vi.fn();
vi.mock("../supabaseClient", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
  },
}));

import {
  atLocationLimit,
  canBuyExtraLocation,
  extraLocationPrice,
  fetchLocationUsage,
  isLocationLimitError,
  LocationBillingError,
  parseLocationUsage,
  setExtraLocations,
  unusedExtraLocations,
  type LocationUsage,
} from "./locations";

const raw = {
  tenant_id: "t1",
  used: 1,
  limit: 1,
  extra_locations: 0,
  plan_tier: "starter",
  status: "active",
  billing_provider: "paddle",
  is_admin: true,
};

const usage = (over: Partial<LocationUsage> = {}): LocationUsage => ({
  tenantId: "t1",
  used: 1,
  limit: 1,
  extraLocations: 0,
  planTier: "starter",
  status: "active",
  billingProvider: "paddle",
  isAdmin: true,
  ...over,
});

beforeEach(() => {
  rpc.mockReset();
  invoke.mockReset();
});

// The displayed prices come from env defaults; pin them so this test says what it means.
vi.mock("../config/runtimeConfig", async (original) => ({
  ...(await original<typeof import("../config/runtimeConfig")>()),
  STARTER_EXTRA_LOCATION_PRICE: 10,
  PRO_EXTRA_LOCATION_PRICE: 15,
}));

describe("parseLocationUsage", () => {
  it("reads a well-formed payload", () => {
    expect(parseLocationUsage(raw)).toEqual(usage());
  });

  it("keeps a null limit (unlimited) as null, not 0", () => {
    expect(parseLocationUsage({ ...raw, limit: null })?.limit).toBeNull();
  });

  it("tolerates missing plan fields (a gym with no subscription row)", () => {
    const parsed = parseLocationUsage({ ...raw, limit: null, plan_tier: null, status: null, billing_provider: null });
    expect(parsed).toMatchObject({ planTier: null, status: null, billingProvider: null });
  });

  it.each([
    ["null", null],
    ["a string", "x"],
    ["an array", [1]],
    // What the dev mock answers for an RPC it does not know:
    ["unrelated mock data", { total_members: 248, active_members: 210 }],
    ["a missing limit", Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "limit"))],
    ["a non-numeric limit", { ...raw, limit: "1" }],
    ["a negative count", { ...raw, used: -1 }],
    ["a fractional count", { ...raw, extra_locations: 1.5 }],
    ["no tenant", { ...raw, tenant_id: undefined }],
    ["a non-boolean admin flag", { ...raw, is_admin: "yes" }],
  ])("rejects %s", (_label, value) => {
    expect(parseLocationUsage(value)).toBeNull();
  });
});

describe("fetchLocationUsage", () => {
  it("returns the parsed usage", async () => {
    rpc.mockResolvedValue({ data: raw, error: null });
    expect(await fetchLocationUsage()).toEqual(usage());
    expect(rpc).toHaveBeenCalledWith("get_location_usage");
  });

  it("returns null on an RPC error or an unreadable answer, never throws", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await fetchLocationUsage()).toBeNull();
    rpc.mockResolvedValue({ data: { total_members: 1 }, error: null });
    expect(await fetchLocationUsage()).toBeNull();
  });
});

describe("limit helpers", () => {
  it("atLocationLimit: full, under, over, and unlimited", () => {
    expect(atLocationLimit(usage({ used: 1, limit: 1 }))).toBe(true);
    expect(atLocationLimit(usage({ used: 0, limit: 1 }))).toBe(false);
    expect(atLocationLimit(usage({ used: 3, limit: 2 }))).toBe(true);
    expect(atLocationLimit(usage({ used: 99, limit: null }))).toBe(false);
  });

  it("canBuyExtraLocation needs an active Paddle subscription on Starter or Pro", () => {
    expect(canBuyExtraLocation(usage())).toBe(true);
    expect(canBuyExtraLocation(usage({ planTier: "pro" }))).toBe(true);
    expect(canBuyExtraLocation(usage({ status: "cancelled" }))).toBe(false);
    expect(canBuyExtraLocation(usage({ billingProvider: "manual" }))).toBe(false);
    expect(canBuyExtraLocation(usage({ planTier: "enterprise" }))).toBe(false);
    expect(canBuyExtraLocation(usage({ planTier: null, billingProvider: null, status: null }))).toBe(false);
  });

  it("unusedExtraLocations counts paid extras no branch needs", () => {
    expect(unusedExtraLocations(usage({ used: 1, extraLocations: 0 }))).toBe(0);
    expect(unusedExtraLocations(usage({ used: 1, extraLocations: 2 }))).toBe(2);
    expect(unusedExtraLocations(usage({ used: 3, extraLocations: 2 }))).toBe(0);
    expect(unusedExtraLocations(usage({ used: 2, extraLocations: 3 }))).toBe(2);
    expect(unusedExtraLocations(usage({ used: 0, extraLocations: 1 }))).toBe(1);
  });

  it("extraLocationPrice follows the plan", () => {
    expect(extraLocationPrice("starter")).toBe(10);
    expect(extraLocationPrice("pro")).toBe(15);
    expect(extraLocationPrice("enterprise")).toBeNull();
    expect(extraLocationPrice(null)).toBeNull();
  });
});

describe("isLocationLimitError", () => {
  it("recognises the database error by code or message", () => {
    expect(isLocationLimitError({ code: "LC001", message: "x" })).toBe(true);
    expect(isLocationLimitError({ message: "location_limit_reached" })).toBe(true);
    expect(isLocationLimitError(new Error("location_limit_reached"))).toBe(true);
  });

  it("does not claim other errors", () => {
    expect(isLocationLimitError({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isLocationLimitError(null)).toBe(false);
    expect(isLocationLimitError("location_limit_reached")).toBe(false);
  });
});

describe("setExtraLocations", () => {
  it("sends an absolute number to the function and returns what billing confirmed", async () => {
    invoke.mockResolvedValue({ data: { extra_locations: 2, limit: 3, synced: true }, error: null });
    expect(await setExtraLocations(2)).toEqual({ extraLocations: 2, limit: 3, synced: true });
    expect(invoke).toHaveBeenCalledWith("paddle-manage-locations", { body: { extra_locations: 2 } });
  });

  it("surfaces synced:false", async () => {
    invoke.mockResolvedValue({ data: { extra_locations: 1, limit: 2, synced: false }, error: null });
    expect((await setExtraLocations(1)).synced).toBe(false);
  });

  it("shows the function's own message on a failed call", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 409, json: async () => ({ error: "Your subscription is not active." }) } },
    });
    await expect(setExtraLocations(1)).rejects.toThrow("Your subscription is not active.");
    await expect(setExtraLocations(1)).rejects.toBeInstanceOf(LocationBillingError);
  });

  it("explains a function that is not deployed, and any other transport failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 404 } } });
    await expect(setExtraLocations(1)).rejects.toThrow("isn't available yet");
    invoke.mockResolvedValue({ data: null, error: new Error("network") });
    await expect(setExtraLocations(1)).rejects.toThrow("Could not reach billing");
  });

  it("rejects an answer it cannot read rather than guessing", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(setExtraLocations(1)).rejects.toThrow("unexpected answer");
  });
});
