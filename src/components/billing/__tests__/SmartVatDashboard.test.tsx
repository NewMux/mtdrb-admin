import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveGymConfig } from "../../../config/gymConfig";

const now = new Date().toISOString();
const tables: Record<string, unknown[]> = {
  invoices: [{ amount: 100, total: 105, vat_total: 5, status: "paid", created_at: now, tax_breakdown: null }],
  pos_sales: [
    { status: "completed", created_at: now, vat_total: 10, tax_breakdown: null },
    { status: "voided", created_at: now, vat_total: 99, tax_breakdown: null },
  ],
  pos_returns: [
    {
      status: "completed",
      created_at: now,
      pos_sales: { vat_total: 10, tax_breakdown: null },
      pos_return_items: [{ quantity: 1, pos_sale_items: { line_vat: 10, quantity: 4 } }],
    },
  ],
  expenses: [],
  vat_returns: [],
};

vi.mock("../../../supabaseClient", () => {
  const query = (table: string) => {
    const result = Promise.resolve({ data: tables[table] ?? [], error: null });
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      range: () => result,
      then: result.then.bind(result),
    };
    return chain;
  };
  return { supabase: { from: (table: string) => query(table) } };
});
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: "en" } }) }));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../../hooks/useRTL", () => ({ useRTL: () => ({ isRTL: false }) }));
vi.mock("../../../contexts/gym-config-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../contexts/gym-config-context")>();
  return {
    ...actual,
    useGymConfig: () => ({
      config: resolveGymConfig(null, { ...actual.PLATFORM_CONFIG_DEFAULTS, currency: "USD", vatRate: 5 }),
    }),
  };
});

import SmartVatDashboard from "../SmartVatDashboard";

describe("SmartVatDashboard", () => {
  it("counts shop sales and subtracts shop returns from the tax collected", async () => {
    render(<SmartVatDashboard tenantId="t1" refreshKey={0} />);
    // invoice 5.00 + sale 10.00 (voided sale ignored) - returned 1/4 of 10.00 = 2.50
    expect((await screen.findAllByText(/12\.50/)).length).toBeGreaterThan(0);
  });
});
