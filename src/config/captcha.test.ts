import { describe, it, expect } from "vitest";
import { getCaptchaSiteKey } from "./captcha";

describe("getCaptchaSiteKey", () => {
  it("is null when unset or blank, so the forms run without a captcha", () => {
    expect(getCaptchaSiteKey({})).toBeNull();
    expect(getCaptchaSiteKey({ VITE_TURNSTILE_SITE_KEY: "   " })).toBeNull();
  });
  it("returns the trimmed key", () => {
    expect(getCaptchaSiteKey({ VITE_TURNSTILE_SITE_KEY: " 0x4AAA " })).toBe("0x4AAA");
  });
});
