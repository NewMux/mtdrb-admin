import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { useRTL } from "../hooks/useRTL";
import {
  validatePassword,
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicy,
} from "../utils/passwordPolicy";

// ===== RESET PASSWORD PAGE =====
// Reached via the recovery link Supabase emails from resetPasswordForEmail.
// supabase-js has `detectSessionInUrl: true`, so it parses the recovery
// token out of the URL and establishes a session before this component's
// effects run; we just need to wait for the PASSWORD_RECOVERY event (or an
// already-established session on fast reloads) before allowing the update.
export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isRTL } = useRTL();

  const [status, setStatus] = React.useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [passwordPolicy, setPasswordPolicy] =
    React.useState<PasswordPolicy>(DEFAULT_PASSWORD_POLICY);

  React.useEffect(() => {
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    // Cover the case where the recovery session was already established
    // (e.g. the auth event fired before this listener attached).
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) setStatus("ready");
    });

    // If neither the event nor an existing session shows up in a reasonable
    // window, the link is missing, expired, or already used.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setStatus((current) => (current === "checking" ? "invalid" : current));
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  // The recovery link establishes a real session, so the tenant's
  // configured password policy (if any) can be looked up the normal,
  // RLS-protected way once we have it - falls back to the platform default.
  React.useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!membership?.tenant_id || cancelled) return;

      const { data: gymSettings } = await supabase
        .from("gym_settings")
        .select("metadata")
        .eq("tenant_id", membership.tenant_id)
        .maybeSingle();
      if (cancelled) return;

      const security = (gymSettings?.metadata as { security?: { min_password_length?: number; require_special_chars?: boolean } } | null)?.security;
      if (security) {
        setPasswordPolicy({
          minLength: security.min_password_length ?? DEFAULT_PASSWORD_POLICY.minLength,
          requireSpecialChars: security.require_special_chars ?? DEFAULT_PASSWORD_POLICY.requireSpecialChars,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password, passwordPolicy);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { password_changed_at: new Date().toISOString() },
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || t("auth.resetPasswordError"));
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* ===== LEFT COLUMN - BRAND VISUALS ===== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-300 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full blur-2xl"></div>
        </div>
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
            <h1 className="text-4xl font-bold mb-4">{t("auth.resetPasswordTitle")}</h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              {t("auth.resetPasswordHeroMessage")}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT COLUMN - FORM ===== */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className={`absolute top-8 ${isRTL ? "left-8 lg:left-8" : "right-8 lg:right-8"}`}>
            <LanguageSwitcher />
          </div>

          <div className="lg:hidden mb-8 text-center">
            <img src="/mtdrb-logo.svg" alt="MTDRB" className="h-10 w-auto mx-auto" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0.1, 0.2, 1] }}
          >
            {status === "checking" && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("auth.resetPasswordInvalidLink")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {t("auth.resetPasswordInvalidLinkDesc")}
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t("auth.requestNewResetLink")}
                  <FiArrowRight className={`h-4 w-4 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                </Link>
              </div>
            )}

            {status === "ready" && done && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <FiCheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("auth.resetPasswordSuccess")}
                </h1>
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  {t("auth.backToLogin")}
                </button>
              </div>
            )}

            {status === "ready" && !done && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("auth.resetPasswordTitle")}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("auth.resetPasswordSubtitle")}
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("auth.newPassword")}
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 ${isRTL ? "right-0 pr-3" : "left-0 pl-3"} flex items-center pointer-events-none`}
                      >
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="new-password"
                        className={`block w-full ${isRTL ? "pr-10 pl-12" : "pl-10 pr-12"} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                        placeholder={t("auth.passwordPlaceholder")}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                      <button
                        type="button"
                        className={`absolute inset-y-0 ${isRTL ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("auth.passwordMinLength")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirm-new-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("auth.confirmNewPassword")}
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 ${isRTL ? "right-0 pr-3" : "left-0 pl-3"} flex items-center pointer-events-none`}
                      >
                        <FiLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirm-new-password"
                        className={`block w-full ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                        placeholder={t("auth.passwordPlaceholder")}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? "ml-2" : "mr-2"}`}
                        ></div>
                        {t("common.loading")}
                      </div>
                    ) : (
                      t("auth.resetPasswordButton")
                    )}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
