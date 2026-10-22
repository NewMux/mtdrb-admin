import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({
  tenantId: "t1" as string | null,
  row: null as Record<string, unknown> | null,
  fetch: vi.fn(),
  save: vi.fn(),
}));

vi.mock("../auth-context", () => ({ useAuth: () => ({ tenantId: h.tenantId }) }));
vi.mock("../../api/settings", () => ({
  fetchGymSettings: (...a: unknown[]) => h.fetch(...a),
  saveGymSettings: (...a: unknown[]) => h.save(...a),
}));

import { GymConfigProvider } from "../GymConfigProvider";
import { useGymConfig, type GymConfigContextType } from "../gym-config-context";
import type { GymConfigInput } from "../../config/gymConfig";

let ctx: GymConfigContextType;
function Probe() {
  ctx = useGymConfig();
  return null;
}

const input: GymConfigInput = {
  country: "KW",
  currency: "KWD",
  timezone: "Asia/Kuwait",
  tax: { enabled: false, name: "VAT", rate: 0, number: "", pricesIncludeTax: false },
  business: { legalName: "", address: "", phone: "", email: "", website: "" },
};

beforeEach(() => {
  h.tenantId = "t1";
  h.row = { tenant_id: "t1", currency: "BHD", vat_enabled: true, vat_rate: 10, metadata: { security: { session_timeout: 45 } } };
  h.fetch.mockReset().mockImplementation(async () => ({ data: h.row, error: null }));
  h.save.mockReset().mockImplementation(async (payload: Record<string, unknown>) => ({ data: { ...payload }, error: null }));
});

async function mount() {
  render(
    <GymConfigProvider>
      <Probe />
    </GymConfigProvider>,
  );
  await waitFor(() => expect(ctx.loading).toBe(false));
}

describe("GymConfigProvider", () => {
  it("exposes the gym's own configuration, not the platform default", async () => {
    await mount();
    expect(ctx.config.currency).toBe("BHD");
    expect(ctx.config.tax).toMatchObject({ enabled: true, rate: 10 });
  });

  it("falls back to platform defaults when the gym has no settings row", async () => {
    h.row = null;
    await mount();
    expect(ctx.config.configured).toBe(false);
  });

  it("does not load anything without a gym", async () => {
    h.tenantId = null;
    await mount();
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it("refuses an invalid configuration without touching the database", async () => {
    await mount();
    let result: Awaited<ReturnType<typeof ctx.save>> | undefined;
    await act(async () => {
      result = await ctx.save({ ...input, currency: "xx" });
    });
    expect(result).toMatchObject({ ok: false, errors: { currency: "currency_invalid" } });
    expect(h.save).not.toHaveBeenCalled();
  });

  it("saves into the freshly read metadata and updates the in-memory config", async () => {
    await mount();
    let result: Awaited<ReturnType<typeof ctx.save>> | undefined;
    await act(async () => {
      result = await ctx.save(input);
    });
    expect(result).toEqual({ ok: true });
    const payload = h.save.mock.calls[0][0];
    expect(payload).toMatchObject({ tenant_id: "t1", currency: "KWD", vat_enabled: false, vat_rate: 0 });
    expect(payload.metadata.security).toEqual({ session_timeout: 45 });
    expect(ctx.config.currency).toBe("KWD");
    expect(ctx.config.configured).toBe(true);
  });

  it("reports a failed write and keeps the old configuration", async () => {
    await mount();
    h.save.mockResolvedValueOnce({ data: null, error: new Error("boom") });
    let result: Awaited<ReturnType<typeof ctx.save>> | undefined;
    await act(async () => {
      result = await ctx.save(input);
    });
    expect(result).toEqual({ ok: false, message: "boom" });
    expect(ctx.config.currency).toBe("BHD");
  });
});
