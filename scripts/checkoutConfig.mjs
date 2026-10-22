// Build-time sanity check for the Paddle checkout settings (run by
// scripts/check-env.mjs, which `npm run build:deploy` and the Docker build use).
//
// Checkout is closed unless VITE_CHECKOUT_ENABLED is exactly "true"
// (src/pages/Subscribe.tsx). That switch fails quietly - a customer just sees
// "checkout is closed" - so this fails the build when it is turned ON with
// settings that cannot work, and warns when it is left off for production.
//
// Rules come from CLAUDE.md: sandbox client tokens start with "test_"; a value
// that does not match the environment is flagged rather than assumed right.

export function checkCheckoutConfig(env) {
  const errors = [];
  const warnings = [];
  const value = (key) => (env[key] ?? "").trim();

  const flag = value("VITE_CHECKOUT_ENABLED");
  const enabled = flag === "true";
  const production = value("VITE_PADDLE_ENVIRONMENT") === "production";

  if (flag && flag !== "true" && flag !== "false") {
    warnings.push(
      `VITE_CHECKOUT_ENABLED is "${flag}". Only the exact value "true" opens checkout; anything else leaves it closed.`,
    );
  }

  if (!enabled) {
    if (production) {
      warnings.push(
        "VITE_PADDLE_ENVIRONMENT=production but VITE_CHECKOUT_ENABLED is not \"true\": customers will see \"checkout is closed\" and cannot subscribe.",
      );
    }
    return { errors, warnings };
  }

  const token = value("VITE_PADDLE_CLIENT_TOKEN");
  for (const [key, label] of [
    ["VITE_PADDLE_CLIENT_TOKEN", "the Paddle client-side token"],
    ["VITE_PADDLE_STARTER_PRICE_ID", "the Starter monthly price ID"],
    ["VITE_PADDLE_PRO_PRICE_ID", "the Pro monthly price ID"],
  ]) {
    if (!value(key)) errors.push(`VITE_CHECKOUT_ENABLED=true needs ${key} (${label}).`);
  }

  if (token) {
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
  }

  return { errors, warnings };
}
