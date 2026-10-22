// Build-time sanity check for the Paddle checkout settings (run by
// scripts/check-env.mjs, which `npm run build:deploy` and the Docker build use).
//
// Checkout is open whenever Paddle is configured; VITE_CHECKOUT_ENABLED=false is a
// kill switch (src/config/checkout.ts has the runtime rule; checkout.test.ts keeps
// the two in step). The failure this guards against is a deployment that quietly
// cannot take payments: a customer would sign up, reach /subscribe and find nothing
// to buy. So a build that leaves checkout open without a working Paddle setup FAILS,
// unless the kill switch is set on purpose.
//
// Rules from CLAUDE.md: sandbox client tokens start with "test_"; a value that does
// not match the environment is flagged rather than assumed right.

export function checkCheckoutConfig(env) {
  const errors = [];
  const warnings = [];
  const value = (key) => (env[key] ?? "").trim();

  const production = value("VITE_PADDLE_ENVIRONMENT") === "production";
  const killSwitch = value("VITE_CHECKOUT_ENABLED").toLowerCase() === "false";

  if (killSwitch) {
    warnings.push(
      "VITE_CHECKOUT_ENABLED=false: new subscriptions are paused. Customers can sign up but will see that subscriptions are unavailable.",
    );
    return { errors, warnings };
  }

  const token = value("VITE_PADDLE_CLIENT_TOKEN");
  const missing = [
    ["VITE_PADDLE_CLIENT_TOKEN", "the Paddle client-side token"],
    ["VITE_PADDLE_STARTER_PRICE_ID", "the Starter monthly price ID"],
    ["VITE_PADDLE_PRO_PRICE_ID", "the Pro monthly price ID"],
  ].filter(([key]) => !value(key));

  if (missing.length > 0) {
    for (const [key, label] of missing) {
      errors.push(`Checkout is open by default but ${key} (${label}) is not set.`);
    }
    errors.push(
      "Set the Paddle values (DEPLOYMENT.md, \"Payment gateway (Paddle)\"), or set VITE_CHECKOUT_ENABLED=false to deploy with subscriptions paused on purpose.",
    );
    return { errors, warnings };
  }

  if (!production && !token.startsWith("test_")) {
    errors.push(
      "VITE_PADDLE_ENVIRONMENT is sandbox but VITE_PADDLE_CLIENT_TOKEN does not start with \"test_\" (sandbox tokens do). Is this a live token?",
    );
  }
  if (production && token.startsWith("test_")) {
    errors.push(
      "VITE_PADDLE_ENVIRONMENT=production but VITE_PADDLE_CLIENT_TOKEN starts with \"test_\" (a sandbox token).",
    );
  }

  // Not an error - a sandbox beta is legitimate - but nobody should discover it from a customer.
  if (!production && errors.length === 0 && (env.VERCEL_ENV === "production")) {
    warnings.push(
      "This is a Vercel PRODUCTION build with Paddle in SANDBOX: customers can complete checkout but nobody is charged. Set VITE_PADDLE_ENVIRONMENT=production with live credentials to take real payments.",
    );
  }

  return { errors, warnings };
}
