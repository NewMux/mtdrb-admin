import { describe, expect, it } from "vitest";
import { formatMoney } from "./formatMoney";

describe("formatMoney", () => {
  it("formats a known currency", () => {
    expect(formatMoney(21.5, "USD", "en")).toBe("$21.50");
  });

  it("keeps the three decimals of BHD", () => {
    expect(formatMoney(33.5, "BHD", "en")).toMatch(/33\.500/);
  });

  it("falls back to the code for a currency the browser does not know", () => {
    expect(formatMoney(5, "NOT-A-CODE", "en")).toBe("NOT-A-CODE 5");
  });
});
