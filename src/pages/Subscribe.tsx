import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { FiCheck, FiCreditCard, FiShield, FiZap, FiUsers } from "react-icons/fi";
import { useSubscription } from "../contexts/SubscriptionContext";
import { withTimeout } from "../utils/withTimeout";
import { SUBSCRIPTION_PLANS } from "../config/runtimeConfig";
import { isSubscriptionEntitled } from "../utils/subscriptionEntitlement";

// Extract the intended post-login redirect path from router location state,
// which react-router types as `unknown`.
function getRedirectPath(state: unknown): string {
  if (
    state &&
    typeof state === "object" &&
    "from" in state &&
    state.from &&
    typeof state.from === "object" &&
    "pathname" in state.from &&
    typeof (state.from as { pathname?: unknown }).pathname === "string"
  ) {
    return (state.from as { pathname: string }).pathname;
  }
  return "/dashboard";
}

// Supabase PostgREST errors are structured objects, not always instances of
// Error. Preserve their message/details/code so database and RLS failures are
// actionable in the UI instead of becoming a generic fallback.
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (!error || typeof error !== "object") return fallback;

  const errorObject = error as Record<string, unknown>;
  const nestedError =
    errorObject.error && typeof errorObject.error === "object"
      ? (errorObject.error as Record<string, unknown>)
      : undefined;
  const message =
    (typeof errorObject.message === "string" && errorObject.message) ||
    (typeof nestedError?.message === "string" && nestedError.message);
  const details = typeof errorObject.details === "string" ? errorObject.details : undefined;
  const hint = typeof errorObject.hint === "string" ? errorObject.hint : undefined;
  const code = typeof errorObject.code === "string" ? errorObject.code : undefined;

  return [message, details, hint, code && `Code: ${code}`].filter(Boolean).join(" ") || fallback;
}

// ===== SUBSCRIBE PAGE =====
export default function Subscribe() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [error, setError] = useState("");
  const {
    isLoading: subscriptionLoading,
    subscription,
  } = useSubscription();
  const hasActiveSubscription = isSubscriptionEntitled(subscription);
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth and paid status on mount. Never leave the page blank if an
  // Auth/Supabase request stalls in the browser.
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const { data, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          8000,
          t("subscribe.authTimeout"),
        );

        if (userError) throw userError;
        if (!data.user) {
          navigate("/login");
          return;
        }

        if (cancelled) return;
        if (hasActiveSubscription) {
          navigate(getRedirectPath(location.state));
        }
      } catch (authError) {
        if (!cancelled) {
          setError(getErrorMessage(authError, t("subscribe.authTimeout")));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void checkAuth();
    return () => {
      cancelled = true;
    };
  }, [
    hasActiveSubscription,
    location.state,
    navigate,
    subscriptionLoading,
    t,
  ]);

  const plans = SUBSCRIPTION_PLANS;

  // Loads Paddle.js (once) and opens Paddle's hosted checkout overlay for
  // the given plan. Unlike the CrediMax integration this replaces, there is
  // no server round-trip to create a checkout session first -- Paddle
  // Billing opens the overlay directly from a price ID, and its own
  // webhook (supabase/functions/paddle-webhook) is the sole source of
  // truth for activation, matching the self-service trigger's
  // service-role-only write rule.
  // Checkout is closed by default: Paddle is still sandbox-only (no live
  // business verification yet), so a completed "purchase" right now would
  // grant full paid access for zero real revenue. Flip
  // VITE_CHECKOUT_ENABLED=true once live payments are actually ready.
  const CHECKOUT_ENABLED = (import.meta.env.VITE_CHECKOUT_ENABLED as string | undefined) === "true";
  const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  const PADDLE_ENVIRONMENT = (import.meta.env.VITE_PADDLE_ENVIRONMENT as string | undefined) || "sandbox";
  const PADDLE_PRICE_IDS: Record<string, string | undefined> = {
    starter: import.meta.env.VITE_PADDLE_STARTER_PRICE_ID as string | undefined,
    pro: import.meta.env.VITE_PADDLE_PRO_PRICE_ID as string | undefined,
  };

  const loadPaddleJs = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Paddle) {
        resolve();
        return;
      }

      const existing = document.getElementById("paddle-js") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Could not load the payment page. Please try again.")));
        return;
      }

      const script = document.createElement("script");
      script.id = "paddle-js";
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load the payment page. Please try again."));
      document.body.appendChild(script);
    });
  };

  const openPaddleCheckout = async (planId: string, tenantId: string, email: string | undefined) => {
    if (!PADDLE_CLIENT_TOKEN) {
      throw new Error("Payments are not configured yet. Please try again later.");
    }
    const priceId = PADDLE_PRICE_IDS[planId];
    if (!priceId) {
      throw new Error("This plan is not available yet. Please try again later.");
    }

    await loadPaddleJs();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Paddle = (window as any).Paddle;
    if (!Paddle) throw new Error("Checkout script did not load correctly.");

    Paddle.Environment.set(PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox");
    Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });

    Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      // Echoed back on every Paddle webhook event so paddle-webhook can
      // resolve the tenant without trusting anything else in the payload.
      customData: { tenant_id: tenantId },
      settings: {
        successUrl: `${window.location.origin}/subscribe/callback`,
      },
    });
  };

  // Every subscription -- first one or a renewal -- goes through a real
  // charge. There is no free-trial path: platform_subscriptions rows are
  // only ever written by the service-role webhook flow now (see migration
  // revoke_self_service_trial_creation.sql), so this is the only way for
  // a client to end up with an entitled subscription.
  const handleSubscribe = async (planId: string) => {
    if (!CHECKOUT_ENABLED) return;
    setSubscribing(true);
    setError("");
    try {
      const plan = plans.find((candidate) => candidate.id === planId);
      if (!plan) {
        throw new Error("Invalid subscription plan");
      }

      const currentUser = (
        await withTimeout(supabase.auth.getUser(), 8000, t("subscribe.authTimeout"))
      ).data.user;
      if (!currentUser) throw new Error(t("onboarding.userNotFound"));

      // Only a tenant admin may manage billing -- mirrors the "Tenant
      // admins can insert/update platform subscriptions" RLS policies.
      // Paddle's checkout opens directly from the client (no server
      // checkpoint the way CrediMax's session-creation call was), so this
      // is enforced here instead.
      const { data: membership, error: membershipError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("memberships")
            .select("tenant_id, role")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ),
        8000,
        "Organization setup is taking longer than expected. Please try again.",
      );
      if (membershipError) throw membershipError;
      if (!membership?.tenant_id) {
        throw new Error("No organization membership found. Please restart signup.");
      }
      if (membership.role !== "admin") {
        throw new Error("Only a workspace admin can manage billing.");
      }

      await openPaddleCheckout(planId, membership.tenant_id, currentUser.email ?? undefined);
    } catch (subscribeError) {
      setError(
        getErrorMessage(
          subscribeError,
          t("subscribe.unableActivate"),
        ),
      );
      if (import.meta.env.DEV) console.error("Subscribe error:", subscribeError);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">{t("subscribe.checkingAccount")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* ===== LEFT COLUMN - BRAND VISUALS ===== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-300 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8">
              <img 
                src="/mtdrb-logo.svg" 
                alt="MTDRB" 
                className="h-12 w-auto filter brightness-0 invert"
              />
            </div>
            
              <h1 className="text-4xl font-bold mb-4">
              {t("subscribe.startTrial")}
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              {t("subscribe.startTrialDescription")}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FiShield className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">{t("subscribe.secureAccount")}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiZap className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">{t("subscribe.instantActivation")}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiUsers className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">{t("subscribe.cancelAnytime")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT COLUMN - SUBSCRIPTION PLANS ===== */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("subscribe.selectPlan")}
            </h1>
            <p className="text-gray-600">
              {t("subscribe.trialNoCard")}
            </p>
          </div>

          {!CHECKOUT_ENABLED && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <p className="font-medium text-blue-900">{t("subscribe.checkoutClosedTitle")}</p>
              <p className="text-sm text-blue-800 mt-1">{t("subscribe.checkoutClosedMessage")}</p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-8 transition-all duration-200 cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t("subscribe.mostPopular")}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t(plan.id === "starter" ? "landing.starter" : "landing.pro")}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t(plan.id === "starter" ? "subscribe.starterDescription" : "subscribe.proDescription")}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.currency} {plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">/{t(`subscribe.${plan.period}`)}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {(t(plan.id === "starter" ? "subscribe.starterFeatures" : "subscribe.proFeatures", { returnObjects: true }) as string[]).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                    !CHECKOUT_ENABLED
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : selectedPlan === plan.id
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(plan.id);
                  }}
                  disabled={subscribing || !CHECKOUT_ENABLED}
                >
                  {!CHECKOUT_ENABLED
                    ? t("subscribe.checkoutClosedButton")
                    : subscribing
                    ? t("subscribe.processing")
                    : t("subscribe.startFreeTrial")}
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <FiShield className="h-4 w-4 mr-2" />
                <span>{t("subscribe.sslSecure")}</span>
              </div>
              <div className="flex items-center">
                <FiCreditCard className="h-4 w-4 mr-2" />
                <span>{t("subscribe.secureCheckout")}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              {t("subscribe.agreeIntro")}{" "}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                {t("subscribe.terms")}
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                {t("subscribe.privacy")}
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← {t("subscribe.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
