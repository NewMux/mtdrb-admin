import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { FiCheck, FiCreditCard, FiShield, FiZap, FiUsers, FiStar } from "react-icons/fi";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../contexts/AuthContext";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [error, setError] = useState("");
  const { tenantId: authTenantId } = useAuth();
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
        setUser(data.user);
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

  // Loads MPGS's hosted checkout.js (once) and hands the browser off to
  // CrediMax's payment page for the given session.
  const redirectToCredimaxCheckout = (gatewayHost: string, sessionId: string) => {
    return new Promise<void>((resolve, reject) => {
      const existing = document.getElementById("credimax-checkout-js");
      const onReady = () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Checkout = (window as any).Checkout;
          if (!Checkout) throw new Error("Checkout script did not load correctly.");
          Checkout.configure({ session: { id: sessionId } });
          Checkout.showPaymentPage();
          resolve();
        } catch (checkoutError) {
          reject(checkoutError);
        }
      };

      if (existing) {
        onReady();
        return;
      }

      const script = document.createElement("script");
      script.id = "credimax-checkout-js";
      script.src = `https://${gatewayHost}/static/checkout/checkout.min.js`;
      script.onload = onReady;
      script.onerror = () => reject(new Error("Could not load the payment page. Please try again."));
      document.body.appendChild(script);
    });
  };

  // An existing (trialing/past_due/cancelled/expired) subscription needs a
  // real charge, not another free trial -- hand off to CrediMax instead of
  // writing to platform_subscriptions directly (the self-service trigger
  // would reject a client-set "active" status or nonzero amount anyway).
  const handleRealCheckout = async (planId: string) => {
    const { data, error: invokeError } = await supabase.functions.invoke("credimax-checkout", {
      body: { planId },
    });
    if (invokeError) throw invokeError;
    if (!data?.sessionId || !data?.gatewayHost) {
      throw new Error("Could not start checkout. Please try again.");
    }

    await redirectToCredimaxCheckout(data.gatewayHost, data.sessionId);
  };

  // Handle subscription
  const handleSubscribe = async (planId: string) => {
    setSubscribing(true);
    setError("");
    try {
      const plan = plans.find((candidate) => candidate.id === planId);
      if (!plan) {
        throw new Error("Invalid subscription plan");
      }

      if (subscription) {
        await handleRealCheckout(planId);
        return;
      }

      const currentUser = user ?? (await withTimeout(
        supabase.auth.getUser(),
        8000,
        t("subscribe.authTimeout"),
      )).data.user;
      if (!currentUser) throw new Error(t("onboarding.userNotFound"));

      // Prefer AuthProvider's membership-derived tenant, but resolve it
      // directly when the provider has not finished hydrating yet.
      let tenantId = authTenantId;
      if (!tenantId) {
        const { data: membership, error: membershipError } = await withTimeout(
          Promise.resolve(
            supabase
              .from("memberships")
              .select("tenant_id")
              .eq("user_id", currentUser.id)
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle(),
          ),
          8000,
          "Organization setup is taking longer than expected. Please try again.",
        );
        if (membershipError) throw membershipError;
        tenantId = membership?.tenant_id ?? null;
      }
      if (!tenantId) throw new Error("No organization membership found. Please restart signup.");

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error: subTableError } = await withTimeout(
        Promise.resolve(
          supabase
            .from("platform_subscriptions")
            .upsert({
              tenant_id: tenantId,
              status: "trialing",
              plan_tier: planId,
              amount: 0,
              currency: plan.currency,
              trial_end: trialEnd,
              current_period_end: trialEnd,
              metadata: {
                method: "self_serve_trial",
                trial_days: 14,
                intended_plan_price: plan.price,
                started_at: now.toISOString(),
              },
              updated_at: now.toISOString(),
            }, { onConflict: "tenant_id" }),
        ),
        15000,
        "Subscription activation is taking longer than expected. Please try again.",
      );

      if (subTableError) throw subTableError;

      // The tenant and subscription are ready. Enter the dashboard now; the
      // remaining gym details can be completed later from Settings.
      navigate("/dashboard", { replace: true });
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
                    selectedPlan === plan.id
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(plan.id);
                  }}
                  disabled={subscribing}
                >
                  {subscribing ? t("subscribe.processing") : t("subscribe.startFreeTrial")}
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
                <span>{t("subscribe.noCreditCard")}</span>
              </div>
              <div className="flex items-center">
                <FiStar className="h-4 w-4 mr-2" />
                <span>{t("subscribe.trial14")}</span>
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
