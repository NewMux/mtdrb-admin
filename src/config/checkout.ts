// Whether customers can subscribe on this deployment.
//
// Checkout is OPEN whenever Paddle is configured (client token + both plan price
// IDs): MTDRB is a self-serve product, so there is nothing to switch on to launch.
// VITE_CHECKOUT_ENABLED=false is a kill switch for pausing new subscriptions
// (maintenance, a Paddle incident). A deployment with no Paddle settings cannot take
// payments, which the Subscribe page says plainly, and `npm run build:deploy` refuses
// to ship it unless the kill switch is set on purpose (scripts/checkoutConfig.mjs
// applies the same rule - checkout.test.ts keeps the two in step).

export type CheckoutUnavailableReason = "disabled" | "not_configured";

export type CheckoutAvailability =
  | { open: true }
  | { open: false; reason: CheckoutUnavailableReason };

export type CheckoutEnv = Record<string, string | undefined>;

export function getCheckoutAvailability(env: CheckoutEnv): CheckoutAvailability {
  const value = (key: string) => (env[key] ?? "").trim();

  if (value("VITE_CHECKOUT_ENABLED").toLowerCase() === "false") {
    return { open: false, reason: "disabled" };
  }

  const configured =
    Boolean(value("VITE_PADDLE_CLIENT_TOKEN")) &&
    Boolean(value("VITE_PADDLE_STARTER_PRICE_ID")) &&
    Boolean(value("VITE_PADDLE_PRO_PRICE_ID"));

  return configured ? { open: true } : { open: false, reason: "not_configured" };
}
