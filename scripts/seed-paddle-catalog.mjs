// One-time setup script: creates MTDRB's Starter/Pro products and prices
// (monthly + annual, BHD, no trial period) in a Paddle Billing account via
// its REST API, plus one "extra location" add-on product/price per plan.
// The add-on is a second line item on a subscription whose quantity is the
// number of extra locations the gym pays for (supabase/functions/
// paddle-manage-locations); the plan itself includes one location.
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
// UNVERIFIED: that Paddle accepts BHD as a price currency. The Paddle docs
// weren't reachable when this was written. If the first POST /prices fails
// with a currency error, BHD isn't supported on your account -- change
// BASE_CURRENCY to one Paddle supports and re-price (see "Re-running"
// below), and update VITE_PLATFORM_CURRENCY to match.
//
// Usage:
//   PADDLE_API_KEY=your_sandbox_key node scripts/seed-paddle-catalog.mjs
//
// Optional:
//   PADDLE_ENVIRONMENT=production node scripts/seed-paddle-catalog.mjs
//     (defaults to sandbox; only use production once you've verified this
//     script's output against sandbox first)
//   node scripts/seed-paddle-catalog.mjs --dry-run
//     (prints the request bodies it would send; makes no network calls and
//     needs no API key)
//   PADDLE_API_KEY=... node scripts/seed-paddle-catalog.mjs --addons-only
//     (creates only the extra-location add-ons. Use this if the Starter/Pro
//     products already exist in your account, so they are not duplicated.)
//
// Never commit a real API key. Pass it as an environment variable, not a
// script argument (arguments can end up in shell history).

const DRY_RUN = process.argv.includes("--dry-run");
const ADDONS_ONLY = process.argv.includes("--addons-only");
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
if (!PADDLE_API_KEY && !DRY_RUN) {
  console.error("Missing PADDLE_API_KEY. Usage: PADDLE_API_KEY=your_sandbox_key node scripts/seed-paddle-catalog.mjs");
  process.exit(1);
}

const ENVIRONMENT = process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
const BASE_URL = ENVIRONMENT === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

if (!DRY_RUN && ENVIRONMENT === "sandbox" && !PADDLE_API_KEY.includes("_sdbx")) {
  console.warn(
    `Warning: PADDLE_ENVIRONMENT=sandbox but the API key doesn't look like a sandbox key ` +
    `(sandbox keys contain "_sdbx"). Double-check you're not about to write to your live account.`,
  );
}

// Paddle takes amounts as strings in the currency's smallest unit. BHD has
// three decimal places (1 BHD = 1000 fils), unlike USD's two, so 20 BHD is
// "20000", not "2000". Keep this table in step with BASE_CURRENCY.
const BASE_CURRENCY = "BHD";
const MINOR_UNIT_DIGITS = { BHD: 3, USD: 2 };

function toMinorUnits(majorAmount) {
  const digits = MINOR_UNIT_DIGITS[BASE_CURRENCY];
  if (digits === undefined) {
    throw new Error(`No minor-unit exponent configured for ${BASE_CURRENCY}; add it to MINOR_UNIT_DIGITS.`);
  }
  return String(Math.round(majorAmount * 10 ** digits));
}

// No country overrides: the old GB/IE/AU amounts were derived from the USD
// 80/130 prices and don't map onto 20/35 BHD without guessing exchange
// rates. Add overrides in the Paddle dashboard once you've decided them.
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for single-location gyms",
    monthlyPrice: 20, // BHD 20.00
    annualPrice: 200, // BHD 200.00 (2 months free)
    // Per extra location. Keep in step with VITE_STARTER_EXTRA_LOCATION_PRICE:
    // that is only the displayed price, this is what is charged.
    extraLocation: { monthlyPrice: 10, annualPrice: 100 },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Everything in Starter & scale your gym",
    monthlyPrice: 35, // BHD 35.00
    annualPrice: 350, // BHD 350.00 (2 months free)
    // Keep in step with VITE_PRO_EXTRA_LOCATION_PRICE (see above).
    extraLocation: { monthlyPrice: 15, annualPrice: 150 },
  },
];

// MTDRB intentionally has no free trial (see
// supabase/migrations/20260909162346_revoke_self_service_trial_creation.sql),
// so prices are created without a trial_period.

let dryRunCounter = 0;

async function paddleFetch(path, body) {
  if (DRY_RUN) {
    dryRunCounter += 1;
    console.log(`[dry-run] POST ${path}\n${JSON.stringify(body, null, 2)}\n`);
    return { id: `dryrun_${dryRunCounter}`, unit_price_overrides: [] };
  }

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

// Highest quantity of the add-on one subscription may hold. Keep in step with
// MAX_EXTRA_LOCATIONS in supabase/functions/paddle-manage-locations/index.ts
// and the CHECK on platform_subscriptions.extra_locations.
const MAX_EXTRA_LOCATIONS = 50;

async function createPrice(productId, description, majorAmount, period, quantityLimits) {
  const isMonthly = period === "monthly";

  const price = await paddleFetch("/prices", {
    product_id: productId,
    description,
    billing_cycle: { interval: isMonthly ? "month" : "year", frequency: 1 },
    tax_mode: "account_setting",
    unit_price: { amount: toMinorUnits(majorAmount), currency_code: BASE_CURRENCY },
    ...(quantityLimits ? { quantity: quantityLimits } : {}),
  });

  return price;
}

async function main() {
  console.log(
    `Seeding Paddle catalog in ${ENVIRONMENT} (${BASE_URL})${DRY_RUN ? " [dry run]" : ""}` +
      `${ADDONS_ONLY ? " [add-ons only]" : ""}...\n`,
  );

  const results = [];
  const addons = [];

  try {
    if (!ADDONS_ONLY) {
      for (const plan of PLANS) {
        console.log(`Creating product: ${plan.name}...`);
        const product = await paddleFetch("/products", {
          name: `MTDRB ${plan.name}`,
          description: plan.description,
          tax_category: "saas",
        });
        console.log(`  Product created: ${product.id}`);
        results.push({ plan: plan.name, productId: product.id });

        const monthlyPrice = await createPrice(product.id, `${plan.name} Monthly`, plan.monthlyPrice, "monthly");
        console.log(`  Monthly price created: ${monthlyPrice.id}`);
        results[results.length - 1].monthlyPriceId = monthlyPrice.id;

        const annualPrice = await createPrice(product.id, `${plan.name} Annual`, plan.annualPrice, "annual");
        console.log(`  Annual price created: ${annualPrice.id}`);
        results[results.length - 1].annualPriceId = annualPrice.id;

        console.log("");
      }
    }

    // One add-on per plan, so Starter and Pro can be priced independently.
    // Quantity is limited to 1..MAX_EXTRA_LOCATIONS: a price's quantity range is
    // what Paddle enforces for one subscription's line item.
    for (const plan of PLANS) {
      console.log(`Creating add-on product: Extra Location (${plan.name})...`);
      const product = await paddleFetch("/products", {
        name: `MTDRB Extra Location (${plan.name})`,
        description: `One additional gym location on the ${plan.name} plan`,
        tax_category: "saas",
      });
      console.log(`  Product created: ${product.id}`);
      addons.push({ plan: plan.name, productId: product.id });

      const quantity = { minimum: 1, maximum: MAX_EXTRA_LOCATIONS };
      const monthlyPrice = await createPrice(
        product.id, `Extra Location (${plan.name}) Monthly`, plan.extraLocation.monthlyPrice, "monthly", quantity,
      );
      console.log(`  Monthly price created: ${monthlyPrice.id}`);
      addons[addons.length - 1].monthlyPriceId = monthlyPrice.id;

      const annualPrice = await createPrice(
        product.id, `Extra Location (${plan.name}) Annual`, plan.extraLocation.annualPrice, "annual", quantity,
      );
      console.log(`  Annual price created: ${annualPrice.id}`);
      addons[addons.length - 1].annualPriceId = annualPrice.id;

      console.log("");
    }
  } catch (error) {
    // Products already created are NOT rolled back. Report them so a re-run
    // can be done without leaving duplicates behind (archive them in the
    // Paddle dashboard first, or use --addons-only if only add-ons failed).
    const created = [
      ...results.map((r) => ({ ...r, label: r.plan })),
      ...addons.map((r) => ({ ...r, label: `Extra Location (${r.plan})` })),
    ];
    if (created.length > 0) {
      console.error("\nCreated before the failure (archive these in Paddle before re-running):");
      for (const result of created) {
        console.error(`  ${result.label}: product ${result.productId}` +
          `${result.monthlyPriceId ? `, monthly ${result.monthlyPriceId}` : ""}` +
          `${result.annualPriceId ? `, annual ${result.annualPriceId}` : ""}`);
      }
    }
    throw error;
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
  for (const result of addons) {
    console.log(`Extra Location (${result.plan}):`);
    console.log(`  Product ID:      ${result.productId}`);
    console.log(`  Monthly price:   ${result.monthlyPriceId}  <- used by paddle-manage-locations`);
    console.log(`  Annual price:    ${result.annualPriceId}  (created for future use, not wired in yet)`);
    console.log("");
  }
  if (!ADDONS_ONLY) {
    console.log("Set these as VITE_PADDLE_STARTER_PRICE_ID / VITE_PADDLE_PRO_PRICE_ID");
    console.log("(Vercel) and PADDLE_STARTER_PRICE_ID / PADDLE_PRO_PRICE_ID (Supabase");
    console.log("Edge Function secrets) using each plan's MONTHLY price ID above.");
  }
  console.log("Set the add-ons' MONTHLY price IDs as the Supabase Edge Function secrets");
  console.log("PADDLE_STARTER_EXTRA_LOCATION_PRICE_ID / PADDLE_PRO_EXTRA_LOCATION_PRICE_ID");
  console.log("(server-side only; the browser never needs them).");
  console.log("=".repeat(70));

  console.log("\nVerify in the Paddle dashboard before trusting this output:");
  console.log(`- Each price shows ${BASE_CURRENCY} 20.00 / 35.00 monthly (200.00 / 350.00 annual), not a units error.`);
  console.log(`- Each add-on price shows ${BASE_CURRENCY} 10.00 (Starter) / 15.00 (Pro) monthly, with a quantity range of 1-${MAX_EXTRA_LOCATIONS}.`);
  console.log("- No price has a trial period (MTDRB has no free trial).");
  console.log("- Nothing was created twice if you re-run this script (it does not");
  console.log("  check for existing products first -- re-running will duplicate them).");
  console.log("- After a sandbox checkout, platform_subscriptions.amount shows 20 / 35");
  console.log("  (paddle-webhook converts by the currency's decimals; see _shared/money.ts).");
  console.log("- After adding an extra location in the app, the Paddle subscription shows two");
  console.log("  items (plan x1, extra location xN) and platform_subscriptions.extra_locations = N.");
}

main().catch((error) => {
  console.error("\nSeeding failed:", error.message);
  process.exit(1);
});
