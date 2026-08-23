import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { FiMail, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { useRTL } from "../hooks/useRTL";
import { useAuthAttemptLimiter } from "../hooks/useAuthAttemptLimiter";

// ===== FORGOT PASSWORD PAGE =====
export default function ForgotPassword() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const { isLocked, remainingSeconds, registerFailure } =
    useAuthAttemptLimiter("forgot-password", email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError(t("auth.tooManyAttempts", { seconds: remainingSeconds }));
      return;
    }
    setLoading(true);
    setError("");

    // Rate-limit per email regardless of outcome. Supabase's own
    // resetPasswordForEmail response does not reveal whether the address is
    // registered, so we don't branch on it either -- avoids leaking account
    // existence via the UI.
    registerFailure();

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message || t("auth.resetLinkError"));
      return;
    }
    setSent(true);
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
            <h1 className="text-4xl font-bold mb-4">
              {t("auth.forgotPasswordTitle")}
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              {t("auth.forgotPasswordHeroMessage")}
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
            {sent ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <FiCheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("auth.resetLinkSentTitle")}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {t("auth.resetLinkSentDesc", { email })}
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {isRTL ? "→ " : "← "}
                  {t("auth.backToLogin")}
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t("auth.forgotPasswordTitle")}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("auth.forgotPasswordSubtitle")}
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("auth.email")}
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 ${isRTL ? "right-0 pr-3" : "left-0 pl-3"} flex items-center pointer-events-none`}
                      >
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        className={`block w-full ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                        placeholder={t("auth.email")}
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        dir={isRTL ? "rtl" : "ltr"}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className={`flex ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className={isRTL ? "mr-3" : "ml-3"}>
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                    whileHover={{ scale: loading || isLocked ? 1 : 1.02 }}
                    whileTap={{ scale: loading || isLocked ? 1 : 0.98 }}
                    disabled={loading || isLocked}
                  >
                    {loading ? (
                      <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? "ml-2" : "mr-2"}`}
                        ></div>
                        {t("common.loading")}
                      </div>
                    ) : isLocked ? (
                      t("auth.tooManyAttempts", { seconds: remainingSeconds })
                    ) : (
                      <div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                        {t("auth.sendResetLink")}
                        <FiArrowRight className={`h-4 w-4 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                      </div>
                    )}
                  </motion.button>
                </form>

                <div className="mt-8 text-center">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    {isRTL ? "→ " : "← "}
                    {t("auth.backToLogin")}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
