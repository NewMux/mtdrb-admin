import React from "react";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiHome, FiArrowRight } from "react-icons/fi";

// ===== SIGNUP PAGE =====
export default function Signup() {
  const navigate = useNavigate();
  
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
        }
        // If user is paid but not onboarded, they should go through onboarding
        // If user is not paid, they should go through subscribe
        // In both cases, let the signup flow handle it
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
  const [signedUpUser, setSignedUpUser] = React.useState<any>(null);

  // ===== HANDLE SIGNUP SUBMIT =====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validate gym name
    if (!gymName.trim()) {
      setError("Please enter your gym name");
      setLoading(false);
      return;
    }
    
    // Sign up with Supabase
    // Use production domain for email redirects, fallback to current origin
    const redirectUrl = import.meta.env.PROD 
      ? 'https://www.mtdrb.fit/dashboard'
      : `${window.location.origin}/dashboard`;
    
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
        // Session is available - user can proceed immediately
        // Show onboarding step
        setShowOnboarding(true);
      } else {
        // Email confirmation might be required
        // Check Supabase settings - if email confirmation is disabled, session should be available
        // Wait a moment for session to establish, then check
        setTimeout(async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            setShowOnboarding(true);
          } else {
            setError("Please check your email to confirm your account, then try again.");
          }
        }, 1000);
      }
    } else {
      setError("Signup successful but user data not available. Please try signing in.");
    }
  };

  // ===== HANDLE ONBOARDING SUBMIT =====
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingLoading(true);
    setOnboardingError("");
    try {
      // First, ensure we have a valid session (required for authenticated requests)
      let session = null;
      let user = signedUpUser;
      
      // Try to get session first (this is what provides the auth token)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        session = sessionData.session;
        user = session.user;
      } else if (sessionError) {
        // If no session, try to refresh or get user
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
          // Try to refresh session
          await supabase.auth.refreshSession();
          const { data: refreshedSession } = await supabase.auth.getSession();
          session = refreshedSession?.session || null;
        }
      }
      
      // If still no user, use stored user (but this won't have auth token)
      if (!user && signedUpUser) {
        user = signedUpUser;
      }
      
      if (!user) {
        throw new Error("User not found. Please try signing up again.");
      }
      
      // If we don't have a session, wait a moment and try again
      // (session might be establishing after signup)
      if (!session) {
        // Wait a bit for session to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: retrySession } = await supabase.auth.getSession();
        if (!retrySession?.session) {
          throw new Error("Session not available. Please try signing in again.");
        }
        session = retrySession.session;
      }
      
      // Create Tenant/org (now with valid session/auth token)
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: gymName || "My Gym",
        })
        .select("id")
        .single();
      if (tenantError) throw new Error(tenantError.message);
      
      // Create Membership (user as admin)
      await supabase.from("memberships").insert({
        user_id: user.id,
        tenant_id: tenantData.id,
        role: "admin",
      });
      
      // Update user metadata with tenantId AND role
      // This ensures PermissionGuard can check the user's role
      await supabase.auth.updateUser({ 
        data: { 
          tenant_id: tenantData.id,
          role: "admin", // Set role in user_metadata so PermissionGuard works
        } 
      });
      
      // Redirect to subscribe
      navigate("/subscribe");
    } catch (err: any) {
      setOnboardingError(err.message || "Failed to set up gym.");
    }
    setOnboardingLoading(false);
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
              Start your gym's digital transformation
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Join thousands of gyms using MTDRB to streamline operations, boost revenue, and deliver exceptional member experiences.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Free 14-day trial, no credit card required</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Setup your gym in under 5 minutes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Cancel anytime, no long-term contracts</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT COLUMN - SIGNUP FORM ===== */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Language Switcher */}
          <div className="absolute top-8 right-8 lg:right-8">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h1>
              <p className="text-gray-600">
                Get started with MTDRB and transform your gym management.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSignup}>
              {/* Gym Name Field */}
              <div className="space-y-2">
                <label htmlFor="gymName" className="block text-sm font-medium text-gray-700">
                  Gym Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHome className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="gymName"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your gym name"
                    required
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </a>
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
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Create account
                    <FiArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== ONBOARDING MODAL ===== */}
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
                <FiHome className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Setting up your gym
              </h2>
              <p className="text-gray-600">
                We're creating your organization and preparing your dashboard.
              </p>
            </div>

            {onboardingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-700">{onboardingError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-700">Creating your organization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-gray-700">Setting up your account</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-500">Redirecting to payment</span>
              </div>
            </div>

            <button
              onClick={handleOnboarding}
              disabled={onboardingLoading}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {onboardingLoading ? "Setting up..." : "Continue"}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
