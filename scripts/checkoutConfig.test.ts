import { describe, expect, it } from "vitest";
// @ts-expect-error - plain ESM script shared with the build
import { checkCheckoutConfig } from "./checkoutConfig.mjs";

const ready = {
  VITE_CHECKOUT_ENABLED: "true",
  VITE_PADDLE_ENVIRONMENT: "sandbox",
  VITE_PADDLE_CLIENT_TOKEN: "test_abc",
  VITE_PADDLE_STARTER_PRICE_ID: "pri_s",
  VITE_PADDLE_PRO_PRICE_ID: "pri_p",
};
const check = (env: Record<string, string>) => checkCheckoutConfig(env) as { errors: string[]; warnings: string[] };

describe("checkCheckoutConfig", () => {
  it("passes a fully configured sandbox checkout", () => {
    expect(check(ready)).toEqual({ errors: [], warnings: [] });
  });

  it("passes a fully configured production checkout", () => {
    expect(check({ ...ready, VITE_PADDLE_ENVIRONMENT: "production", VITE_PADDLE_CLIENT_TOKEN: "live_abc" })).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("checkout off in sandbox is fine and silent", () => {
    expect(check({})).toEqual({ errors: [], warnings: [] });
    expect(check({ VITE_CHECKOUT_ENABLED: "false" })).toEqual({ errors: [], warnings: [] });
  });

  it("checkout off for production warns that customers cannot subscribe, but does not fail", () => {
    const out = check({ VITE_PADDLE_ENVIRONMENT: "production" });
    expect(out.errors).toEqual([]);
    expect(out.warnings.join(" ")).toMatch(/cannot subscribe/);
  });

  it.each([["TRUE"], ["1"], ["yes"], ["True"]])("warns that %s does not open checkout (only exact 'true' does)", (flag) => {
    const out = check({ VITE_CHECKOUT_ENABLED: flag });
    expect(out.warnings.join(" ")).toMatch(/exact value "true"/);
    expect(out.errors).toEqual([]);
  });

  it.each([
    ["VITE_PADDLE_CLIENT_TOKEN"],
    ["VITE_PADDLE_STARTER_PRICE_ID"],
    ["VITE_PADDLE_PRO_PRICE_ID"],
  ])("fails when checkout is on and %s is missing or blank", (key) => {
    expect(check({ ...ready, [key]: "" }).errors.join(" ")).toContain(key);
    expect(check({ ...ready, [key]: "   " }).errors.join(" ")).toContain(key);
  });

  it("fails on a live-looking token in sandbox, and a sandbox token in production", () => {
    expect(check({ ...ready, VITE_PADDLE_CLIENT_TOKEN: "live_abc" }).errors.join(" ")).toMatch(/does not start with "test_"/);
    expect(
      check({ ...ready, VITE_PADDLE_ENVIRONMENT: "production", VITE_PADDLE_CLIENT_TOKEN: "test_abc" }).errors.join(" "),
    ).toMatch(/starts with "test_"/);
  });

  it("does not check the token's prefix when there is no token (the missing-token error covers it)", () => {
    const errors = check({ ...ready, VITE_PADDLE_CLIENT_TOKEN: "" }).errors;
    expect(errors).toHaveLength(1);
  });
});
