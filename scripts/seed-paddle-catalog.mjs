// One-time setup script: creates MTDRB's Starter/Pro products and prices
// (monthly + annual, BHD by default, 7-day trial, no country overrides) in a
// Paddle Billing account via its REST API.
//
// UNVERIFIED: whether Paddle accepts BHD (a 3-decimal currency) as a catalog
// currency, and what "smallest unit" means for it, could not be checked from
// the session that wrote this (no paddle-docs access). Run it against sandbox
// first; if Paddle rejects the currency the API error is printed and nothing
// is silently mis-priced. Override with PADDLE_BASE_CURRENCY=USD etc.
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

const BASE_CURRENCY = (process.env.PADDLE_BASE_CURRENCY || "BHD").toUpperCase();

// Decimal places per currency (ISO 4217). Paddle amounts are strings in the
// currency's smallest unit, so BHD 20.000 is "20000", not "2000".
const THREE_DECIMAL = new Set(["BHD", "KWD", "OMR", "JOD", "TND"]);
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK"]);

function toMinorUnits(amount, currency) {
  const decimals = ZERO_DECIMAL.has(currency) ? 0 : THREE_DECIMAL.has(currency) ? 3 : 2;
  return String(Math.round(amount * 10 ** decimals));
}

// Country price overrides were removed: they were USD-era starting points
// (GBP 70, EUR 75, AUD 120 for Starter) that make no sense next to BHD 20.
// Add overrides in the Paddle dashboard once you've decided regional pricing.
const COUNTRY_OVERRIDES = {};

// Annual = 10x monthly (two months free), the same ratio as before.
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for single-location gyms",
    monthly: 20, // BHD 20 / month
    annual: 200,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Everything in Starter & scale your gym",
    monthly: 35, // BHD 35 / month
    annual: 350,
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
  const amount = toMinorUnits(isMonthly ? plan.monthly : plan.annual, BASE_CURRENCY);

  const price = await paddleFetch("/prices", {
    product_id: productId,
    description: `${plan.name} ${isMonthly ? "Monthly" : "Annual"}`,
    billing_cycle: { interval: isMonthly ? "month" : "year", frequency: 1 },
    trial_period: TRIAL_PERIOD,
    tax_mode: "account_setting",
    unit_price: { amount, currency_code: BASE_CURRENCY },
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
