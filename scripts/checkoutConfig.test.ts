import { describe, expect, it } from "vitest";
// @ts-expect-error - plain ESM script shared with the build
import { checkCheckoutConfig, PADDLE_BILLING_CURRENCIES } from "./checkoutConfig.mjs";
import { getCheckoutAvailability } from "../src/config/checkout";

type Env = Record<string, string>;
const ready: Env = {
  VITE_PADDLE_ENVIRONMENT: "sandbox",
  VITE_PADDLE_CLIENT_TOKEN: "test_abc",
  VITE_PADDLE_STARTER_PRICE_ID: "pri_s",
  VITE_PADDLE_PRO_PRICE_ID: "pri_p",
  VITE_PLATFORM_CURRENCY: "USD",
  VITE_STARTER_PRICE: "49",
  VITE_PRO_PRICE: "89",
  VITE_STARTER_EXTRA_LOCATION_PRICE: "25",
  VITE_PRO_EXTRA_LOCATION_PRICE: "35",
};
const check = (env: Env) => checkCheckoutConfig(env) as { errors: string[]; warnings: string[] };

describe("checkCheckoutConfig (the build guard)", () => {
  it("passes a configured sandbox deployment, with checkout open by default", () => {
    expect(check(ready)).toEqual({ errors: [], warnings: [] });
  });

  it("passes a configured production deployment", () => {
    expect(check({ ...ready, VITE_PADDLE_ENVIRONMENT: "production", VITE_PADDLE_CLIENT_TOKEN: "live_abc" })).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it.each(["VITE_PADDLE_CLIENT_TOKEN", "VITE_PADDLE_STARTER_PRICE_ID", "VITE_PADDLE_PRO_PRICE_ID"])(
    "FAILS when %s is missing or blank and the kill switch is not set (no silent 'cannot pay' deployments)",
    (key) => {
      for (const blank of ["", "   "]) {
        const out = check({ ...ready, [key]: blank });
        expect(out.errors.join(" ")).toContain(key);
        expect(out.errors.join(" ")).toContain("VITE_CHECKOUT_ENABLED=false");
      }
    },
  );

  it("fails a deployment with no Paddle settings at all, naming every missing value", () => {
    const out = check({});
    expect(out.errors.join(" ")).toContain("VITE_PADDLE_CLIENT_TOKEN");
    expect(out.errors.join(" ")).toContain("VITE_PADDLE_STARTER_PRICE_ID");
    expect(out.errors.join(" ")).toContain("VITE_PADDLE_PRO_PRICE_ID");
  });

  it("the kill switch lets a deployment ship with subscriptions paused, with a warning, even with no Paddle settings", () => {
    for (const flag of ["false", "FALSE", " False "]) {
      const out = check({ VITE_CHECKOUT_ENABLED: flag });
      expect(out.errors).toEqual([]);
      expect(out.warnings.join(" ")).toContain("paused");
    }
  });

  it.each([["true"], ["TRUE"], ["1"], ["yes"], [""]])("%j does not close checkout (only 'false' does)", (flag) => {
    expect(check({ ...ready, VITE_CHECKOUT_ENABLED: flag }).errors).toEqual([]);
  });

  it("fails on a live-looking token in sandbox, and a sandbox token in production", () => {
    expect(check({ ...ready, VITE_PADDLE_CLIENT_TOKEN: "live_abc" }).errors.join(" ")).toMatch(/does not start with "test_"/);
    expect(
      check({ ...ready, VITE_PADDLE_ENVIRONMENT: "production", VITE_PADDLE_CLIENT_TOKEN: "test_abc" }).errors.join(" "),
    ).toMatch(/starts with "test_"/);
  });

  it("warns when a Vercel production build runs Paddle in sandbox, without failing it", () => {
    const out = check({ ...ready, VERCEL_ENV: "production" });
    expect(out.errors).toEqual([]);
    expect(out.warnings.join(" ")).toMatch(/nobody is charged/);
    expect(check({ ...ready, VERCEL_ENV: "preview" }).warnings).toEqual([]);
  });
});

describe("getCheckoutAvailability (the app) agrees with the build guard", () => {
  const cases: Array<[string, Env]> = [
    ["configured", ready],
    ["configured, flag true", { ...ready, VITE_CHECKOUT_ENABLED: "true" }],
    ["configured, flag false", { ...ready, VITE_CHECKOUT_ENABLED: "false" }],
    ["configured, flag FALSE", { ...ready, VITE_CHECKOUT_ENABLED: "FALSE" }],
    ["nothing configured", {}],
    ["nothing configured, flag false", { VITE_CHECKOUT_ENABLED: "false" }],
    ["no token", { ...ready, VITE_PADDLE_CLIENT_TOKEN: "" }],
    ["no starter price", { ...ready, VITE_PADDLE_STARTER_PRICE_ID: " " }],
    ["no pro price", { ...ready, VITE_PADDLE_PRO_PRICE_ID: "" }],
  ];

  it.each(cases)("%s: the app opens checkout exactly when the build guard raises no config error and the kill switch is off", (_label, env) => {
    const availability = getCheckoutAvailability(env);
    const guard = check(env);
    const killSwitch = (env.VITE_CHECKOUT_ENABLED ?? "").trim().toLowerCase() === "false";
    expect(availability.open).toBe(!killSwitch && guard.errors.length === 0);
  });

  it("says why it is closed", () => {
    expect(getCheckoutAvailability({ ...ready, VITE_CHECKOUT_ENABLED: "false" })).toEqual({ open: false, reason: "disabled" });
    expect(getCheckoutAvailability({})).toEqual({ open: false, reason: "not_configured" });
    expect(getCheckoutAvailability(ready)).toEqual({ open: true });
  });
});

describe("displayed prices must match what Paddle charges", () => {
  it("fails when the platform currency is a currency Paddle cannot bill in", () => {
    for (const bad of ["BHD", "AED", "SAR", "KWD", "OMR", "QAR", "bhd"]) {
      const out = check({ ...ready, VITE_PLATFORM_CURRENCY: bad });
      expect(out.errors.join(" ")).toContain("not a currency Paddle can bill in");
    }
  });

  it("accepts the currencies Paddle supports, in any case", () => {
    for (const ok of ["USD", "eur", "GBP"]) expect(check({ ...ready, VITE_PLATFORM_CURRENCY: ok }).errors).toEqual([]);
    expect(PADDLE_BILLING_CURRENCIES).toContain("USD");
    expect(PADDLE_BILLING_CURRENCIES).not.toContain("BHD");
  });

  it("fails when the currency or a plan price is left to the code defaults", () => {
    expect(check({ ...ready, VITE_PLATFORM_CURRENCY: "" }).errors.join(" ")).toContain("VITE_PLATFORM_CURRENCY is not set");
    for (const key of ["VITE_STARTER_PRICE", "VITE_PRO_PRICE"]) {
      for (const bad of ["", "abc", "0", "-5"]) {
        expect(check({ ...ready, [key]: bad }).errors.join(" ")).toContain(key);
      }
    }
  });

  it("only warns about extra-location prices", () => {
    const out = check({ ...ready, VITE_STARTER_EXTRA_LOCATION_PRICE: "" });
    expect(out.errors).toEqual([]);
    expect(out.warnings.join(" ")).toContain("VITE_STARTER_EXTRA_LOCATION_PRICE");
  });

  it("does not apply while the kill switch has paused checkout", () => {
    expect(check({ VITE_CHECKOUT_ENABLED: "false", VITE_PLATFORM_CURRENCY: "BHD" }).errors).toEqual([]);
  });
});
