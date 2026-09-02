import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

// Handles the browser's return from CrediMax's hosted checkout page. The
// webhook (supabase/functions/credimax-webhook) is the actual source of
// truth for activation -- this page only polls platform_subscriptions until
// the webhook has caught up (or a reasonable timeout passes), since the
// customer's browser landing back on this URL doesn't by itself mean the
// server-to-server notification has already been processed.

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

type CallbackState = "checking" | "success" | "pending" | "failed";

export default function SubscribeCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenantId } = useAuth();
  const [state, setState] = useState<CallbackState>("checking");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const { data } = await supabase
        .from("platform_subscriptions")
        .select("status, payment_reference")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (cancelled) return;

      if (data?.status === "active" && (!orderId || data.payment_reference === orderId)) {
        setState("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        return;
      }

      if (data?.status === "failed") {
        setState("failed");
        return;
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setState("pending");
        return;
      }

      setTimeout(() => void poll(), POLL_INTERVAL_MS);
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [tenantId, orderId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-md w-full text-center">
        {state === "checking" && (
          <>
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t("subscribeCallback.checking", "Confirming your payment...")}
            </h1>
            <p className="text-gray-600">
              {t("subscribeCallback.checkingDescription", "This usually takes a few seconds.")}
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t("subscribeCallback.success", "Payment confirmed")}
            </h1>
            <p className="text-gray-600">
              {t("subscribeCallback.successDescription", "Taking you to your dashboard...")}
            </p>
          </>
        )}

        {state === "pending" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t("subscribeCallback.pending", "Still confirming your payment")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t(
                "subscribeCallback.pendingDescription",
                "This is taking longer than expected. If your card was charged, this will update automatically within a few minutes.",
              )}
            </p>
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-500">
              {t("subscribeCallback.continueToDashboard", "Continue to dashboard")}
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t("subscribeCallback.failed", "Payment was not successful")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t("subscribeCallback.failedDescription", "No charge went through. You can try again.")}
            </p>
            <Link to="/subscribe" className="text-blue-600 hover:text-blue-500">
              {t("subscribeCallback.tryAgain", "Try again")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
