import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";
import { ensureGym, type GymSetupClient } from "../utils/ensureGym";

// Where a new account lands after confirming its email: creates the gym the
// signup form asked for, then continues to checkout. Also the safety net for
// anyone signed in without a gym.
export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  const started = React.useRef(-1);

  React.useEffect(() => {
    // StrictMode runs effects twice in development; run each attempt once so
    // two concurrent create calls can't race each other.
    if (started.current === attempt) return;
    started.current = attempt;

    const run = async () => {
      setError("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }
        await ensureGym(supabase as unknown as GymSetupClient, user);
        navigate("/subscribe", { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        setError(message || t("welcome.failed"));
      }
    };
    void run();
  }, [attempt, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-6">
      <div className="max-w-md w-full text-center">
        <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-10 w-auto mx-auto mb-8" />
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t("welcome.errorTitle")}</h1>
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t("welcome.retry")}
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t("welcome.title")}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t("welcome.subtitle")}</p>
          </>
        )}
      </div>
    </div>
  );
}
