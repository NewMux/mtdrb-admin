import { describe, expect, it } from "vitest";
import { minorUnitDigits, paddleAmountToMajor } from "./money";

describe("minorUnitDigits", () => {
  it("uses each currency's ISO 4217 exponent", () => {
    expect(minorUnitDigits("USD")).toBe(2);
    expect(minorUnitDigits("BHD")).toBe(3);
    expect(minorUnitDigits("KWD")).toBe(3);
    expect(minorUnitDigits("JPY")).toBe(0);
  });

  it("falls back to 2 for a malformed code", () => {
    expect(minorUnitDigits("not-a-currency")).toBe(2);
  });
});

describe("paddleAmountToMajor", () => {
  it("converts 2-decimal currencies", () => {
    expect(paddleAmountToMajor("8000", "USD")).toBe(80);
    expect(paddleAmountToMajor("1999", "USD")).toBe(19.99);
  });

  it("converts BHD's 3-decimal minor unit (the old /100 gave 200 for 20 BHD)", () => {
    expect(paddleAmountToMajor("20000", "BHD")).toBe(20);
    expect(paddleAmountToMajor("35000", "BHD")).toBe(35);
    expect(paddleAmountToMajor("20500", "BHD")).toBe(20.5);
  });

  it("converts zero-decimal currencies", () => {
    expect(paddleAmountToMajor("3500", "JPY")).toBe(3500);
  });

  it("returns null instead of guessing when the input can't be interpreted", () => {
    expect(paddleAmountToMajor("20000", undefined)).toBeNull();
    expect(paddleAmountToMajor(20000, "BHD")).toBeNull();
    expect(paddleAmountToMajor("20.00", "BHD")).toBeNull();
    expect(paddleAmountToMajor("-500", "USD")).toBeNull();
    expect(paddleAmountToMajor(undefined, "USD")).toBeNull();
  });
});
