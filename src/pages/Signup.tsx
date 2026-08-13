import React from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiHome, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import type { User } from "@supabase/supabase-js";
import { withTimeout } from "../utils/withTimeout";

// ===== SIGNUP PAGE =====
export default function Signup() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  // Check if user is already authenticated and redirect if needed
  // Only redirect if user is fully set up (paid and onboarded)
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Only redirect if user is fully set up (paid and onboarded)
        // Otherwise, let them complete the signup flow
        if (user.user_metadata?.paid && user.user_metadata?.onboarding_completed) {
          navigate("/dashboard", { replace: true });
        } else {
          const { data: membership } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (membership?.tenant_id) {
            // Membership setup already completed in a prior attempt.
            navigate("/subscribe", { replace: true });
          }
        }
        // If user is not paid and has no tenant yet, let the signup flow handle it
      }
    };
    checkAuth();
  }, [navigate]);

  // ===== FORM STATE =====
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [gymName, setGymName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [onboardingLoading, setOnboardingLoading] = React.useState(false);
  const [onboardingError, setOnboardingError] = React.useState("");
  const [signedUpUser, setSignedUpUser] = React.useState<User | null>(null);

  // ===== HANDLE SIGNUP SUBMIT =====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validate gym name
    if (!gymName.trim()) {
      setError(t("auth.pleaseEnterGymName"));
      setLoading(false);
      return;
    }
    
    // Sign up with Supabase
    // Use VITE_APP_URL for email redirects, fallback to current origin
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUrl = `${appUrl}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { name, gym_name: gymName },
        emailRedirectTo: redirectUrl,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data?.user) {
      // Store the user and session from signup response
      setSignedUpUser(data.user);
      // If session is available, it's already set in Supabase client
      // If email confirmation is required, session might be null
      if (data.session) {
        // Session is available - auto-create tenant and proceed
        await createTenantAndProceed();
      } else {
        // Email confirmation might be required
        // Check Supabase settings - if email confirmation is disabled, session should be available
        // Wait a moment for session to establish, then check
        setTimeout(async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            await createTenantAndProceed();
          } else {
            setError(t("auth.checkEmailConfirm"));
          }
        }, 1000);
      }
    } else {
      setError(t("auth.signupSuccessButNoUser"));
    }
  };

  // ===== AUTO-CREATE TENANT AND PROCEED =====
  const createTenantAndProceed = async () => {
    setShowOnboarding(true); // Show loading modal
    setOnboardingLoading(true);
    setOnboardingError("");

    try {
      if (!signedUpUser) {
        throw new Error("Missing signed-up user. Please refresh and try again.");
      }

      // A prior attempt may have already created the tenant/membership and
      // only failed on a later step (e.g. the updateUser timeout below).
      // Reuse that membership instead of creating a duplicate tenant on retry.
      const { data: existingMembership } = await withTimeout(
        Promise.resolve(
          supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", signedUpUser.id)
            .maybeSingle()
        ),
        10000,
        "Checking your account is taking longer than expected. Please try again."
      );

      let tenantId: string | null | undefined = existingMembership?.tenant_id;

      if (!tenantId) {
        // Create Tenant/org and membership using RPC function (bypasses RLS)
        const { data: newTenantId, error: tenantError } = await withTimeout(
          Promise.resolve(
            supabase.rpc('create_tenant_with_membership', {
              p_tenant_name: gymName || "My Gym",
              p_user_role: 'admin',
              p_tenant_metadata: {}
            })
          ),
          15000,
          "Setting up your gym is taking longer than expected. Please check your connection and try again."
        );

        if (tenantError) {
          if (import.meta.env.DEV) console.error("Error creating tenant:", tenantError);
          throw new Error(tenantError.message || "Failed to create organization");
        }

        if (!newTenantId) {
          throw new Error("Failed to create organization: No tenant ID returned");
        }

        tenantId = newTenantId;
      }

      // Store the organization name as profile context only. Tenant and role
      // authorization is resolved from the memberships table.
      await withTimeout(
        Promise.resolve(
          supabase.auth.updateUser({
            data: { gym_name: gymName },
          })
        ),
        10000,
        "Setting up your account is taking longer than expected. Please try again."
      );

      // Redirect to subscribe
      navigate("/subscribe");
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Tenant creation error:", err);
      const message = err instanceof Error ? err.message : undefined;
      setOnboardingError(message || "Failed to set up gym. Please try again.");
      setOnboardingLoading(false);
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
              {t("auth.signupSlogan")}
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              {t("auth.signupDescription")}
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

      {/* ===== RIGHT COLUMN - SIGNUP FORM ===== */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
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
                {t("auth.createAccount")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("auth.createAccountSubtitle")}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSignup}>
              {/* Gym Name Field */}
              <div className="space-y-2">
                <label htmlFor="gymName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("auth.gymName")} *
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <FiHome className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="gymName"
                    className={`block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder={t("auth.gymNamePlaceholder")}
                    required
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    disabled={loading}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("auth.fullName")} *
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    className={`block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder={t("auth.fullNamePlaceholder")}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("auth.emailAddress")} *
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={`block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder={t("auth.emailPlaceholder")}
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
                  {t("auth.password")} *
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`block w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("auth.passwordMinLength")}
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    required
                  />
                </div>
                <div className={`${isRTL ? 'mr-3' : 'ml-3'} text-sm`}>
                  <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
                    {t("auth.agreeTerms")}{" "}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                      {t("auth.termsOfService")}
                    </Link>{" "}
                    {t("auth.and")}{" "}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                      {t("auth.privacyPolicy")}
                    </Link>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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

              {/* Signup Button */}
              <motion.button
                type="submit"
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                    {t("auth.creatingAccount")}
                  </div>
                ) : (
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {t("auth.createAccountButton")}
                    <FiArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} h-4 w-4`} />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t("auth.signIn")}
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isRTL ? '→ ' : '← '}{t("auth.backToHome")}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== ONBOARDING MODAL (Loading State) ===== */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {onboardingLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : onboardingError ? (
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <FiHome className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {onboardingError ? t("auth.setupFailed") : t("auth.settingUpGym")}
              </h2>
              <p className="text-gray-600">
                {onboardingError 
                  ? t("auth.setupFailedDescription")
                  : t("auth.settingUpDescription")
                }
              </p>
            </div>

            {onboardingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700">{onboardingError}</p>
              </div>
            )}

            {!onboardingError && (
              <div className={`space-y-4 ${isRTL ? 'space-y-reverse' : ''}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
                  <div className={`w-2 h-2 rounded-full ${onboardingLoading ? 'bg-blue-600 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-700">{t("auth.creatingOrganization")}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
                  <div className={`w-2 h-2 rounded-full ${onboardingLoading ? 'bg-blue-600 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-700">{t("auth.settingUpAccount")}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'}`}>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-500">{t("auth.redirectingToSubscription")}</span>
                </div>
              </div>
            )}

            {onboardingError && (
              <button
                onClick={() => signedUpUser && createTenantAndProceed()}
                disabled={onboardingLoading}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {t("auth.tryAgain")}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
