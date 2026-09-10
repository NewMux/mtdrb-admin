// One-time setup script: creates MTDRB's Starter/Pro products and prices
// (monthly + annual, USD, 7-day trial, with GB/IE/AU price overrides) in a
// Paddle Billing account via its REST API.
//
// This session's network egress is policy-blocked from reaching Paddle's
// API directly (confirmed: the proxy itself returns 403 on the CONNECT,
// not an auth failure), so this script was written but never run or
// tested against a live account -- run it somewhere with real network
// access (your machine, the other Claude Code session) and read the
// output carefully. It follows Paddle's published Billing API v2 shape
// (developer.paddle.com/api-reference) from stable, public documentation,
// not a live-verified account, the same caveat as paddle-webhook.
//
// Usage:
//   PADDLE_API_KEY=your_sandbox_key node scripts/seed-paddle-catalog.mjs
//
// Optional:
//   PADDLE_ENVIRONMENT=production node scripts/seed-paddle-catalog.mjs
//     (defaults to sandbox; only use production once you've verified this
//     script's output against sandbox first)
//
// Never commit a real API key. Pass it as an environment variable, not a
// script argument (arguments can end up in shell history).

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
if (!PADDLE_API_KEY) {
  console.error("Missing PADDLE_API_KEY. Usage: PADDLE_API_KEY=your_sandbox_key node scripts/seed-paddle-catalog.mjs");
  process.exit(1);
}

const ENVIRONMENT = process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
const BASE_URL = ENVIRONMENT === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

if (ENVIRONMENT === "sandbox" && !PADDLE_API_KEY.includes("_sdbx")) {
  console.warn(
    `Warning: PADDLE_ENVIRONMENT=sandbox but the API key doesn't look like a sandbox key ` +
    `(sandbox keys contain "_sdbx"). Double-check you're not about to write to your live account.`,
  );
}

// Country overrides are starting points -- adjust after reviewing them in
// the Paddle dashboard. Annual override amounts follow the same ~10x
// (two-months-free) ratio as the USD base prices below.
const COUNTRY_OVERRIDES = {
  GB: { currency: "GBP", monthly: { starter: "7000", pro: "11500" }, annual: { starter: "70000", pro: "115000" } },
  IE: { currency: "EUR", monthly: { starter: "7500", pro: "12000" }, annual: { starter: "75000", pro: "120000" } },
  AU: { currency: "AUD", monthly: { starter: "12000", pro: "19000" }, annual: { starter: "120000", pro: "190000" } },
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for single-location gyms",
    monthlyAmount: "8000", // USD 80.00
    annualAmount: "80000", // USD 800.00 (2 months free)
  },
  {
    id: "pro",
    name: "Pro",
    description: "Everything in Starter & scale your gym",
    monthlyAmount: "13000", // USD 130.00
    annualAmount: "130000", // USD 1,300.00 (2 months free)
  },
];

const TRIAL_PERIOD = { interval: "day", frequency: 7 };

async function paddleFetch(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`Paddle API error on POST ${path}:`, JSON.stringify(json ?? { status: response.status }, null, 2));
    throw new Error(`Paddle API request failed (${response.status})`);
  }
  return json.data;
}

function buildOverrides(period, planId) {
  return Object.entries(COUNTRY_OVERRIDES).map(([countryCode, config]) => ({
    country_codes: [countryCode],
    unit_price: {
      amount: config[period][planId],
      currency_code: config.currency,
    },
  }));
}

async function createPrice(productId, plan, period) {
  const isMonthly = period === "monthly";
  const amount = isMonthly ? plan.monthlyAmount : plan.annualAmount;

  const price = await paddleFetch("/prices", {
    product_id: productId,
    description: `${plan.name} ${isMonthly ? "Monthly" : "Annual"}`,
    billing_cycle: { interval: isMonthly ? "month" : "year", frequency: 1 },
    trial_period: TRIAL_PERIOD,
    tax_mode: "account_setting",
    unit_price: { amount, currency_code: "USD" },
    unit_price_overrides: buildOverrides(period, plan.id),
  });

  return price;
}

async function main() {
  console.log(`Seeding Paddle catalog in ${ENVIRONMENT} (${BASE_URL})...\n`);

  const results = [];

  for (const plan of PLANS) {
    console.log(`Creating product: ${plan.name}...`);
    const product = await paddleFetch("/products", {
      name: `MTDRB ${plan.name}`,
      description: plan.description,
      tax_category: "saas",
    });
    console.log(`  Product created: ${product.id}`);

    const monthlyPrice = await createPrice(product.id, plan, "monthly");
    console.log(`  Monthly price created: ${monthlyPrice.id}`);

    const annualPrice = await createPrice(product.id, plan, "annual");
    console.log(`  Annual price created: ${annualPrice.id}`);

    results.push({
      plan: plan.name,
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
      monthlyOverrides: monthlyPrice.unit_price_overrides,
      annualOverrides: annualPrice.unit_price_overrides,
    });
    console.log("");
  }

  console.log("=".repeat(70));
  console.log("DONE. Product/price ID mapping:\n");
  for (const result of results) {
    console.log(`${result.plan}:`);
    console.log(`  Product ID:      ${result.productId}`);
    console.log(`  Monthly price:   ${result.monthlyPriceId}  <- this is the one Subscribe.tsx uses today`);
    console.log(`  Annual price:    ${result.annualPriceId}  (created for future use, not wired into checkout yet)`);
    console.log("");
  }
  console.log("Set these as VITE_PADDLE_STARTER_PRICE_ID / VITE_PADDLE_PRO_PRICE_ID");
  console.log("(Vercel) and PADDLE_STARTER_PRICE_ID / PADDLE_PRO_PRICE_ID (Supabase");
  console.log("Edge Function secrets) using each plan's MONTHLY price ID above.");
  console.log("=".repeat(70));

  console.log("\nVerify in the Paddle dashboard before trusting this output:");
  console.log("- Each price's trial period actually shows 7 days.");
  console.log("- The GB/IE/EUR/AU overrides show the right amounts, not a units error.");
  console.log("- Nothing was created twice if you re-run this script (it does not");
  console.log("  check for existing products first -- re-running will duplicate them).");
}

main().catch((error) => {
  console.error("\nSeeding failed:", error.message);
  process.exit(1);
});
