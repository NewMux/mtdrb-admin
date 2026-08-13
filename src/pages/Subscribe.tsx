import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { FiCheck, FiCreditCard, FiShield, FiZap, FiUsers, FiStar } from "react-icons/fi";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../contexts/AuthContext";

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

// ===== SUBSCRIBE PAGE =====
export default function Subscribe() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [error, setError] = useState("");
  const { userMetadata, tenantId: authTenantId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth and paid status on mount
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!data.user) {
          navigate("/login");
          return;
        }
        setUser(data.user as User);
        // Paid status is resolved from platform_subscriptions by AuthProvider;
        // user_metadata is not an entitlement source.
        if (userMetadata?.paid) {
          const from = getRedirectPath(location.state);
          navigate(from);
          return;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate, location.state, userMetadata?.paid]);

  // Subscription plans
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 80,
      period: "month",
      description: "Perfect for single-location gyms",
      features: [
        "All core features",
        "Single location",
        "+$20 USD/month per extra location",
        "Basic analytics",
        "Email support"
      ],
      popular: false,
      color: "blue"
    },
    {
      id: "pro",
      name: "Pro",
      price: 130,
      period: "month",
      description: "Everything in Starter & scale your gym",
      features: [
        "Everything in Starter",
        "$10 USD/month per extra location",
        "Unlimited members",
        "Advanced analytics",
        "Priority support",
        "WhatsApp bot"
      ],
      popular: true,
      color: "purple"
    }
  ];

  // Handle subscription
  const handleSubscribe = async (planId: string) => {
    setSubscribing(true);
    setError("");
    try {
      if (!["starter", "pro"].includes(planId)) {
        throw new Error("Invalid subscription plan");
      }

      // Upsert the database subscription for the authenticated membership.
      // The RLS policy requires an admin membership for this write.
      const tenantId = authTenantId;
      if (!tenantId) {
        throw new Error("No organization membership found");
      }
      {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const { error: subTableError } = await supabase
          .from("platform_subscriptions")
          .upsert({
            tenant_id: tenantId,
            status: "active",
            plan_tier: planId,
            amount: plans.find((p) => p.id === planId)?.price ?? 0,
            currency: "USD",
            current_period_end: periodEnd,
            metadata: {
              method: "trial_checkout",
              last_payment_date: now.toISOString()
            },
            updated_at: now.toISOString()
          }, {
            onConflict: "tenant_id"
          });

        if (subTableError) {
          console.error("Error updating platform_subscription row:", subTableError);
        }
      }

      // Onboarding completion is profile context, not authorization. The
      // organization and entitlement have already been verified above.
      if (user?.user_metadata?.onboarding_completed) {
        navigate(getRedirectPath(location.state));
      } else {
        navigate("/onboarding");
      }
    } catch (e) {
      setError("Unexpected error");
      if (import.meta.env.DEV) console.error("Subscribe error:", e);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen w-full flex">
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
              Choose your plan
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Start with a free trial, then choose the plan that fits your gym&apos;s needs. You can upgrade or downgrade anytime.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FiShield className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">Secure payment processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiZap className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">Instant activation</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiUsers className="h-5 w-5 text-blue-300" />
                <span className="text-blue-100">Cancel anytime</span>
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
              Select Your Plan
            </h1>
            <p className="text-gray-600">
              Start your 14-day free trial. No credit card required.
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
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
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
                  {subscribing ? "Processing..." : "Start Free Trial"}
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
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center">
                <FiCreditCard className="h-4 w-4 mr-2" />
                <span>Multiple payment methods</span>
              </div>
              <div className="flex items-center">
                <FiStar className="h-4 w-4 mr-2" />
                <span>30-day money back</span>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              By subscribing, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
