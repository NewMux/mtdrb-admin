import { supabase } from "../supabaseClient";
import { MPGS_GATEWAY_HOST } from "../config/runtimeConfig";

// Must match the Edge Function's MPGS_API_VERSION default.
const CHECKOUT_JS_VERSION = "100";

declare global {
  interface Window {
    Checkout?: {
      configure: (options: { session: { id: string } }) => void;
      showPaymentPage: () => void;
    };
  }
}

let checkoutScriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Checkout) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${MPGS_GATEWAY_HOST}/checkout/version/${CHECKOUT_JS_VERSION}/checkout.js`;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load the payment provider's checkout script"));
    document.head.appendChild(script);
  });

  return checkoutScriptPromise;
}

/**
 * Starts an MPGS Hosted Checkout session for the given plan and redirects
 * the browser to Mastercard's hosted payment page. That redirect (to
 * Mastercard's own domain) is what keeps card data off this app entirely -
 * the actual payment result is confirmed server-side by the mpgs-webhook
 * Edge Function, never trusted from anything read back in this browser tab
 * after the redirect returns.
 */
export async function startSubscriptionCheckout(planTier: "starter" | "pro"): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ sessionId: string; orderId: string }>(
    "create-checkout-session",
    { body: { planTier } },
  );
  if (error || !data?.sessionId) {
    throw new Error(error?.message || "Unable to start checkout");
  }

  await loadCheckoutScript();
  if (!window.Checkout) {
    throw new Error("Payment provider script did not load");
  }

  window.Checkout.configure({ session: { id: data.sessionId } });
  window.Checkout.showPaymentPage();
}
