import { describe, it, expect } from "vitest";
import { aggregateTaxBreakdowns, allocateTax, combinedRate, parseTaxBreakdown, taxLabel, type TaxComponent } from "./taxMath";

const vat = (rate: number): TaxComponent => ({ name: "VAT", rate, compound: false });
const service = (rate: number, compound = false): TaxComponent => ({ name: "Service", rate, compound });

describe("combinedRate", () => {
  it("is zero with no taxes and the rate itself with one", () => {
    expect(combinedRate([])).toBe(0);
    expect(combinedRate([vat(10)])).toBe(10);
    expect(combinedRate([vat(7.5)])).toBe(7.5);
  });

  it("adds taxes that are charged on the net amount", () => {
    expect(combinedRate([service(10), vat(10)])).toBe(20);
    expect(combinedRate([vat(5), { name: "PST", rate: 7, compound: false }])).toBe(12);
  });

  it("compounds: the second tax is charged on net + the first tax", () => {
    // 1.10 x 1.10 = 1.21 -> 21%
    expect(combinedRate([service(10), vat(10)].map((c, i) => ({ ...c, compound: i === 1 })))).toBe(21);
    // 5% then 15% on top: 5 + 15 x 1.05 = 20.75
    expect(combinedRate([vat(5), { name: "X", rate: 15, compound: true }])).toBe(20.75);
  });

  it("the first component's compound flag has no effect", () => {
    expect(combinedRate([{ name: "A", rate: 10, compound: true }])).toBe(10);
  });

  it("returns null when the combined rate needs more than two decimals", () => {
    // 7.5% then 8.25% compounded: 7.5 + 8.25 x 1.075 = 16.36875
    expect(combinedRate([vat(7.5), { name: "B", rate: 8.25, compound: true }])).toBeNull();
  });

  it("handles three components, mixed", () => {
    // A 5 (net), B 10 compound: 10 x 1.05 = 10.5, C 2 net: 2 -> 17.5
    expect(
      combinedRate([
        { name: "A", rate: 5, compound: false },
        { name: "B", rate: 10, compound: true },
        { name: "C", rate: 2, compound: false },
      ]),
    ).toBe(17.5);
  });
});

describe("allocateTax", () => {
  const sum = (lines: { amount: number }[]) => Math.round(lines.reduce((a, l) => a + l.amount, 0) * 1000) / 1000;

  it("gives one tax all of it", () => {
    expect(allocateTax(12.5, [vat(10)], "USD")).toEqual([{ name: "VAT", rate: 10, compound: false, amount: 12.5 }]);
  });

  it("splits in proportion to each tax's weight", () => {
    // 10% + 10% on net 100: tax 20 -> 10 + 10
    expect(allocateTax(20, [service(10), vat(10)], "USD").map((l) => l.amount)).toEqual([10, 10]);
    // 5% + 15%: tax 20 -> 5 + 15
    expect(allocateTax(20, [vat(5), { name: "X", rate: 15, compound: false }], "USD").map((l) => l.amount)).toEqual([5, 15]);
  });

  it("splits a compounded pair by what each actually charged", () => {
    // 10% then 10% compounded on net 100: first 10, second 11 -> total 21
    expect(allocateTax(21, [service(10), vat(10)].map((c, i) => ({ ...c, compound: i === 1 })), "USD").map((l) => l.amount)).toEqual([10, 11]);
  });

  it("always adds up to the tax total, rounding by the largest remainder", () => {
    // 1 cent between two equal taxes: the earlier one gets it
    expect(allocateTax(0.01, [service(10), vat(10)], "USD").map((l) => l.amount)).toEqual([0.01, 0]);
    // 0.10 across 3 equal taxes: 0.04 / 0.03 / 0.03
    const three = [service(5), vat(5), { name: "T", rate: 5, compound: false }];
    const lines = allocateTax(0.1, three, "USD");
    expect(lines.map((l) => l.amount)).toEqual([0.04, 0.03, 0.03]);
    expect(sum(lines)).toBe(0.1);
  });

  it("uses the currency's decimals", () => {
    // BHD has 3: 0.001 stays 0.001
    expect(allocateTax(1.001, [service(10), vat(10)], "BHD").map((l) => l.amount)).toEqual([0.501, 0.5]);
    // JPY has 0: 7 yen across two equal taxes -> 4 + 3
    expect(allocateTax(7, [service(10), vat(10)], "JPY").map((l) => l.amount)).toEqual([4, 3]);
  });

  it("splits nothing when there is no tax or every rate is zero", () => {
    expect(allocateTax(0, [vat(10)], "USD")[0].amount).toBe(0);
    expect(allocateTax(5, [vat(0), service(0)], "USD").map((l) => l.amount)).toEqual([0, 0]);
    expect(allocateTax(5, [], "USD")).toEqual([]);
  });

  it("is safe with junk amounts", () => {
    expect(allocateTax(Number.NaN, [vat(10)], "USD")[0].amount).toBe(0);
    expect(allocateTax(-5, [vat(10)], "USD")[0].amount).toBe(0);
  });

  it("agrees with combinedRate: splitting net x combined rate adds back to the same total", () => {
    const comps: TaxComponent[] = [service(10), { name: "VAT", rate: 5, compound: true }, { name: "L", rate: 2, compound: false }];
    const rate = combinedRate(comps)!;
    const tax = Math.round(250 * rate) / 100; // 250.00 net
    expect(sum(allocateTax(tax, comps, "USD"))).toBe(tax);
  });
});

describe("taxLabel", () => {
  it("joins the names", () => {
    expect(taxLabel([{ name: "VAT" }])).toBe("VAT");
    expect(taxLabel([{ name: "Service charge" }, { name: " VAT " }])).toBe("Service charge + VAT");
    expect(taxLabel([])).toBe("VAT");
  });
});

describe("parseTaxBreakdown", () => {
  it("reads a stored breakdown", () => {
    expect(parseTaxBreakdown([{ name: "VAT", rate: "10", compound: true, amount: "12.500" }])).toEqual([
      { name: "VAT", rate: 10, compound: true, amount: 12.5 },
    ]);
  });
  it("treats empty or malformed values as no breakdown", () => {
    expect(parseTaxBreakdown(null)).toBeNull();
    expect(parseTaxBreakdown([])).toBeNull();
    expect(parseTaxBreakdown("x")).toBeNull();
    expect(parseTaxBreakdown([{ name: "", rate: 1, amount: 1 }])).toBeNull();
    expect(parseTaxBreakdown([{ name: "VAT", rate: "abc", amount: 1 }])).toBeNull();
    expect(parseTaxBreakdown([null])).toBeNull();
  });
});

describe("aggregateTaxBreakdowns", () => {
  const line = (name: string, amount: number) => ({ name, rate: 10, compound: false, amount });

  it("adds up each tax across documents", () => {
    const totals = aggregateTaxBreakdowns(
      [
        { breakdown: [line("Service", 10), line("VAT", 11)], taxTotal: 21 },
        { breakdown: [line("Service", 5), line("VAT", 5.5)], taxTotal: 10.5 },
      ],
      "VAT",
      "USD",
    );
    expect(totals).toEqual([
      { name: "VAT", amount: 16.5 },
      { name: "Service", amount: 15 },
    ]);
  });

  it("counts a document with no breakdown under the fallback name, so the total is complete", () => {
    const totals = aggregateTaxBreakdowns(
      [
        { breakdown: null, taxTotal: 7 },
        { breakdown: [line("VAT", 3)], taxTotal: 3 },
        { breakdown: null, taxTotal: 0 },
      ],
      "VAT",
      "USD",
    );
    expect(totals).toEqual([{ name: "VAT", amount: 10 }]);
  });

  it("adds fils exactly", () => {
    const totals = aggregateTaxBreakdowns(Array.from({ length: 10 }, () => ({ breakdown: [line("VAT", 0.1)], taxTotal: 0.1 })), "VAT", "BHD");
    expect(totals).toEqual([{ name: "VAT", amount: 1 }]);
  });

  it("is empty when nothing was charged", () => {
    expect(aggregateTaxBreakdowns([], "VAT", "USD")).toEqual([]);
  });
});
