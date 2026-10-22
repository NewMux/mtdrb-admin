import { describe, expect, it } from "vitest";
import { posVatDocuments } from "./posVat";
import { aggregateTaxBreakdowns } from "./taxMath";

const breakdown = [
  { name: "VAT", rate: 10, compound: false, amount: 6 },
  { name: "Service charge", rate: 5, compound: false, amount: 4 },
];
const sale = { status: "completed", created_at: "2026-10-01T10:00:00Z", vat_total: 10, tax_breakdown: breakdown };

describe("posVatDocuments", () => {
  it("counts completed, partially returned and returned sales but never voided ones", () => {
    const docs = posVatDocuments(
      [sale, { ...sale, status: "partially_returned" }, { ...sale, status: "returned" }, { ...sale, status: "voided" }],
      [],
      "USD",
    );
    expect(docs).toHaveLength(3);
    expect(docs.reduce((s, d) => s + d.taxTotal, 0)).toBe(30);
  });

  it("skips sales that charged no tax", () => {
    expect(posVatDocuments([{ ...sale, vat_total: 0 }, { ...sale, vat_total: null }], [], "USD")).toEqual([]);
  });

  it("takes a return's tax pro rata to the quantity handed back, split like the sale", () => {
    const ret = {
      status: "completed",
      created_at: "2026-10-05T10:00:00Z",
      pos_sales: { vat_total: 10, tax_breakdown: breakdown },
      pos_return_items: [{ quantity: 1, pos_sale_items: { line_vat: 10, quantity: 4 } }],
    };
    const docs = posVatDocuments([sale], [ret], "USD");
    const refund = docs[1];
    expect(refund.taxTotal).toBe(-2.5);
    expect(refund.date).toBe("2026-10-05T10:00:00Z");
    expect(refund.breakdown?.map((l) => [l.name, l.amount])).toEqual([["VAT", -1.5], ["Service charge", -1]]);
    // Net per tax across both documents.
    expect(aggregateTaxBreakdowns(docs, "VAT", "USD")).toEqual([
      { name: "VAT", amount: 4.5 },
      { name: "Service charge", amount: 3 },
    ]);
  });

  it("a full return offsets the sale exactly", () => {
    const ret = {
      created_at: "2026-10-02T10:00:00Z",
      pos_sales: { vat_total: 10, tax_breakdown: breakdown },
      pos_return_items: [{ quantity: 4, pos_sale_items: { line_vat: 10, quantity: 4 } }],
    };
    const docs = posVatDocuments([{ ...sale, status: "returned" }], [ret], "USD");
    expect(docs.reduce((s, d) => s + d.taxTotal, 0)).toBe(0);
    expect(aggregateTaxBreakdowns(docs, "VAT", "USD")).toEqual([
      { name: "Service charge", amount: 0 },
      { name: "VAT", amount: 0 },
    ]);
  });

  it("ignores cancelled returns and never refunds more tax than the sale had", () => {
    const base = { created_at: "2026-10-05T10:00:00Z", pos_sales: { vat_total: 10, tax_breakdown: null } };
    const items = [{ quantity: 4, pos_sale_items: { line_vat: 10, quantity: 4 } }];
    expect(posVatDocuments([], [{ ...base, status: "cancelled", pos_return_items: items }], "USD")).toEqual([]);
    const over = posVatDocuments([], [{ ...base, pos_return_items: [{ quantity: 9, pos_sale_items: { line_vat: 10, quantity: 4 } }] }], "USD");
    expect(over[0].taxTotal).toBe(-10);
    expect(over[0].breakdown).toBeNull();
  });

  it("rounds to the currency's decimals (BHD has 3)", () => {
    const ret = {
      created_at: "2026-10-05T10:00:00Z",
      pos_sales: { vat_total: 1, tax_breakdown: null },
      pos_return_items: [{ quantity: 1, pos_sale_items: { line_vat: 1, quantity: 3 } }],
    };
    expect(posVatDocuments([], [ret], "BHD")[0].taxTotal).toBe(-0.333);
    expect(posVatDocuments([], [ret], "USD")[0].taxTotal).toBe(-0.33);
  });

  it("tolerates missing or malformed rows", () => {
    expect(posVatDocuments([], [{ created_at: "x" }, { created_at: "x", pos_return_items: [{}] }], "USD")).toEqual([]);
  });
});
