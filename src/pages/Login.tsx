import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../supabaseClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";

// ===== LOGIN PAGE =====
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // ===== FORM STATE =====
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // ===== HANDLE LOGIN SUBMIT =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      setError(error.message);
    } else {
      // Check paid status
      const { data } = await supabase.auth.getUser();
      setLoading(false);
      if (
        data.user &&
        data.user.user_metadata &&
        data.user.user_metadata.paid
      ) {
        // Get intended destination from URL state or default to dashboard
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        navigate(from);
      } else {
        navigate("/subscribe");
      }
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
              Welcome back to your gym
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Sign in to continue managing your fitness business with the most powerful gym management platform in the region.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Manage members, classes, and trainers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Automated billing and VAT reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Real-time analytics and insights</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT COLUMN - LOGIN FORM ===== */}
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
                Sign in to your account
              </h1>
              <p className="text-gray-600">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
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
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot password?
                </a>
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

              {/* Login Button */}
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
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Sign in
                    <FiArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign up for free
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
    </div>
  );
}
