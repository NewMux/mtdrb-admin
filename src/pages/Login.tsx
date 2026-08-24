import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../supabaseClient";
import { useNavigate, Link, useLocation, Navigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useRTL } from "../hooks/useRTL";
import { useAuthAttemptLimiter } from "../hooks/useAuthAttemptLimiter";

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

// ===== LOGIN PAGE =====
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { isRTL } = useRTL();

  // ===== FORM STATE =====
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [lockoutThreshold, setLockoutThreshold] = React.useState(5);

  // The tenant's configured lockout threshold isn't known until we can
  // resolve which gym this email belongs to - not possible pre-auth via the
  // normal (RLS-protected) membership lookup, so this uses a narrow,
  // anon-callable RPC that returns only the threshold number (default 5),
  // the same either way whether or not the email has an account.
  React.useEffect(() => {
    if (!email || !email.includes("@")) return;
    let cancelled = false;
    const timeout = setTimeout(() => {
      supabase
        .rpc("get_lockout_threshold", { p_email: email })
        .then(({ data }) => {
          if (!cancelled && typeof data === "number") {
            setLockoutThreshold(data);
          }
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [email]);

  const { isLocked, remainingSeconds, registerFailure, reset } =
    useAuthAttemptLimiter("login", email, lockoutThreshold);

  // Immediate redirect if already authenticated (including dev bypass)
  // Use Navigate component for synchronous redirect to prevent flickering
  if (!isLoading && user) {
    const from = getRedirectPath(location.state);
    return <Navigate to={from} replace />;
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ===== HANDLE LOGIN SUBMIT =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError(t("auth.tooManyAttempts", { seconds: remainingSeconds }));
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      registerFailure();
      setError(t("auth.invalidCredentials"));
    } else {
      setLoading(false);
      reset();
      void logLoginActivity();
      // Entitlement is resolved centrally by SubscriptionProvider and enforced
      // by subscription-aware pages, not by mirrored user metadata.
      const from = getRedirectPath(location.state);
      navigate(from);
    }
  };

  // Best-effort sign-in record for Settings > Security > Login History.
  // Never blocks or fails the login itself - if this errors (e.g. no
  // membership yet), it just silently doesn't get logged this once.
  const logLoginActivity = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!membership?.tenant_id) return;

      await supabase.from("activities").insert({
        tenant_id: membership.tenant_id,
        type: "login",
        title: "Signed in",
        description: `${user.email || "A user"} signed in`,
        user_id: user.id,
        status: "success",
      });
    } catch {
      // Non-critical - login already succeeded.
    }
  };

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
              {t("auth.welcomeBack")}
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              {t("auth.welcomeMessage")}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full flex-shrink-0"></div>
                <span className="text-blue-100 text-start">{t("auth.feature1")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full flex-shrink-0"></div>
                <span className="text-blue-100 text-start">{t("auth.feature2")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full flex-shrink-0"></div>
                <span className="text-blue-100 text-start">{t("auth.feature3")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT COLUMN - LOGIN FORM ===== */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Language Switcher */}
          <div className={`absolute top-8 ${isRTL ? 'left-8 lg:left-8' : 'right-8 lg:right-8'}`}>
            <LanguageSwitcher />
          </div>

          {/* Logo for mobile */}
          <div className="lg:hidden mb-8 text-center">
            <img 
              src="/mtdrb-logo.svg" 
              alt="MTDRB" 
              className="h-10 w-auto mx-auto"
            />
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0.1, 0.2, 1] }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("auth.login")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("auth.loginSubtitle")}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={`block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
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

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`block w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder={t("auth.password")}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  <button
                    type="button"
                    className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className={`${isRTL ? 'mr-2' : 'ml-2'} block text-sm text-gray-700 dark:text-gray-300`}>
                    {t("auth.rememberMe")}
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className={isRTL ? 'mr-3' : 'ml-3'}>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <motion.button
                type="submit"
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: loading || isLocked ? 1 : 1.02 }}
                whileTap={{ scale: loading || isLocked ? 1 : 0.98 }}
                disabled={loading || isLocked}
              >
                {loading ? (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                    {t("common.loading")}
                  </div>
                ) : isLocked ? (
                  t("auth.tooManyAttempts", { seconds: remainingSeconds })
                ) : (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {t("auth.signIn")}
                    <FiArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("auth.dontHaveAccount")}{" "}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {isRTL ? '→ ' : '← '}{t("common.back")} {t("common.to")} {t("common.home")}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
