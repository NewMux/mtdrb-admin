import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import { supabase } from "../supabaseClient";

type CheckoutOutcome = "pending" | "completed" | "failed" | "not_found" | "timed_out";

// How long to keep polling for the mpgs-webhook Edge Function to resolve
// this session before giving up and telling the payer to check back later.
// The redirect back from MPGS's hosted page is not itself proof of payment
// (see mpgsCheckout.ts) - this page waits for the server-confirmed result.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

export default function SubscribeComplete() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const [outcome, setOutcome] = useState<CheckoutOutcome>("pending");
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!orderId) {
      setOutcome("not_found");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const { data, error } = await supabase
        .from("platform_checkout_sessions")
        .select("status")
        .eq("mpgs_order_id", orderId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setOutcome("not_found");
        return;
      }

      if (data.status === "completed") {
        setOutcome("completed");
        return;
      }
      if (data.status === "failed") {
        setOutcome("failed");
        return;
      }

      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        // Still pending after the timeout - not necessarily a failure, the
        // webhook may just be slow (MPGS's own docs note delivery isn't
        // guaranteed-timely). Stop polling and let the payer know rather
        // than leaving them on a spinner indefinitely.
        setOutcome("timed_out");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (outcome !== "completed") return undefined;
    const timer = setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [outcome, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        {outcome === "pending" && (
          <>
            <FiLoader className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("subscribe.confirmingPayment", "Confirming your payment…")}
            </h1>
            <p className="text-gray-600">
              {t(
                "subscribe.confirmingPaymentDesc",
                "This can take a few moments. Please don't close this page.",
              )}
            </p>
          </>
        )}

        {outcome === "completed" && (
          <>
            <FiCheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("subscribe.paymentSuccess", "Payment successful")}
            </h1>
            <p className="text-gray-600">
              {t("subscribe.paymentSuccessDesc", "Redirecting you to your dashboard…")}
            </p>
          </>
        )}

        {outcome === "failed" && (
          <>
            <FiXCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("subscribe.paymentFailed", "Payment didn't go through")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t(
                "subscribe.paymentFailedDesc",
                "No charge was made. You can try again or use a different card.",
              )}
            </p>
            <Link to="/subscribe" className="text-blue-600 hover:text-blue-500 font-medium">
              {t("subscribe.tryAgain", "Try again")}
            </Link>
          </>
        )}

        {outcome === "timed_out" && (
          <>
            <FiLoader className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("subscribe.stillProcessing", "This is taking longer than expected")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t(
                "subscribe.stillProcessingDesc",
                "Your payment may still be processing. Check your dashboard in a few minutes, or contact support if the charge went through but your plan hasn't updated.",
              )}
            </p>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium">
              {t("subscribe.goToDashboard", "Go to dashboard")}
            </Link>
          </>
        )}

        {outcome === "not_found" && (
          <>
            <FiXCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t("subscribe.checkoutNotFound", "We couldn't find that checkout")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t(
                "subscribe.checkoutNotFoundDesc",
                "If you completed a payment, check your dashboard - it may take a minute to reflect. Otherwise, try starting again.",
              )}
            </p>
            <Link to="/subscribe" className="text-blue-600 hover:text-blue-500 font-medium">
              {t("subscribe.backToPlans", "Back to plans")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
