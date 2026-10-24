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

  it("subtracts a return's stored tax, per tax, in the month of the return", () => {
    const ret = {
      status: "completed",
      created_at: "2026-10-05T10:00:00Z",
      vat_total: 2.5,
      tax_breakdown: [
        { name: "VAT", rate: 10, compound: false, amount: 1.5 },
        { name: "Service charge", rate: 5, compound: false, amount: 1 },
      ],
    };
    const docs = posVatDocuments([sale], [ret], "USD");
    expect(docs[1]).toMatchObject({ date: "2026-10-05T10:00:00Z", taxTotal: -2.5 });
    expect(aggregateTaxBreakdowns(docs, "VAT", "USD")).toEqual([
      { name: "VAT", amount: 4.5 },
      { name: "Service charge", amount: 3 },
    ]);
  });

  it("a full return offsets the sale exactly", () => {
    const ret = { created_at: "2026-10-02T10:00:00Z", vat_total: 10, tax_breakdown: breakdown };
    const docs = posVatDocuments([{ ...sale, status: "returned" }], [ret], "USD");
    expect(docs.reduce((s, d) => s + d.taxTotal, 0)).toBe(0);
    expect(aggregateTaxBreakdowns(docs, "VAT", "USD").every((l) => l.amount === 0)).toBe(true);
  });

  it("uses the total when a return has no per-tax split, and ignores cancelled or empty returns", () => {
    const docs = posVatDocuments(
      [],
      [
        { created_at: "x", vat_total: "1.250", tax_breakdown: null },
        { created_at: "x", status: "cancelled", vat_total: 9 },
        { created_at: "x", vat_total: 0 },
        { created_at: "x" },
      ],
      "BHD",
    );
    expect(docs).toEqual([{ date: "x", breakdown: null, taxTotal: -1.25 }]);
  });

  it("tolerates malformed rows", () => {
    expect(posVatDocuments([{ created_at: "x", vat_total: "nope" }], [{ created_at: "x", vat_total: "nope" }], "USD")).toEqual([]);
  });
});
