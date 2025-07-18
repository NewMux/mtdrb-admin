import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';

// ===== LOGIN PAGE =====
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // ===== FORM STATE =====
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // ===== HANDLE LOGIN SUBMIT =====
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
    } else {
      // Check paid status
      const { data } = await supabase.auth.getUser();
      setLoading(false);
      if (data.user && data.user.user_metadata && data.user.user_metadata.paid) {
        // Get intended destination from URL state or default to dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from);
      } else {
        navigate('/subscribe');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased text-blue-900 bg-gradient-to-br from-white to-blue-50">
      {/* ===== LANGUAGE SWITCHER TOP RIGHT ===== */}
      <div className="absolute top-8 right-8 z-10">
        <LanguageSwitcher />
      </div>

      {/* ===== LOGIN CARD ===== */}
      <motion.div
        className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl border border-blue-100 px-12 py-14 flex flex-col items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0.1, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="mb-8">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-[#0D1F85] via-[#155FD9] via-[#489BFA] to-[#7BBDFE] bg-clip-text text-transparent select-none tracking-tight" style={{letterSpacing: '-0.02em'}}>MTDRB</span>
        </div>
        {/* Title & Subtitle */}
        <h1 className="text-2xl font-bold mb-2 text-blue-900">{t('login.title', 'Sign in to your account')}</h1>
        <p className="text-blue-400 mb-8 text-base">{t('login.subtitle', 'Welcome back! Please enter your details.')}</p>

        {/* ===== LOGIN FORM ===== */}
        <form className="w-full flex flex-col gap-6" onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="relative">
            <input
              type="email"
              id="email"
              className="peer w-full px-4 pt-6 pb-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-transparent"
              placeholder={t('login.email', 'Email address')}
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="email" className="absolute left-4 top-2 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
              {t('login.email', 'Email address')}
            </label>
          </div>
          {/* Password Field */}
          <div className="relative">
            <input
              type="password"
              id="password"
              className="peer w-full px-4 pt-6 pb-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-transparent"
              placeholder={t('login.password', 'Password')}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="password" className="absolute left-4 top-2 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
              {t('login.password', 'Password')}
            </label>
          </div>
          {/* Forgot Password */}
          <div className="flex justify-end mb-2">
            <a href="#" className="text-blue-500 hover:underline text-sm font-medium">{t('login.forgot', 'Forgot password?')}</a>
          </div>
          {/* Error Message */}
          {error && <div className="text-red-500 text-sm text-center -mt-2">{error}</div>}
          {/* Login Button */}
          <motion.button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 min-h-[44px]"
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            disabled={loading}
          >
            {loading ? t('login.loading', 'Signing In...') : t('login.button', 'Sign In')}
          </motion.button>
          {/* Link to Signup */}
          <div className="mt-8 text-blue-400 text-sm">
            {t('login.no_account', "Don't have an account?")}{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-600 underline transition">{t('login.signup', 'Sign Up')}</Link>
          </div>
        </form>

        {/* Back to Home Link */}
        <a href="/" className="mt-8 text-blue-400 hover:text-blue-600 text-sm underline transition">{t('login.back', '← Back to Home')}</a>
      </motion.div>
    </div>
  );
} 