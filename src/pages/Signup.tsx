import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

// ===== SIGNUP PAGE =====
export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ===== FORM STATE =====
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [onboardingLoading, setOnboardingLoading] = React.useState(false);
  const [onboardingError, setOnboardingError] = React.useState('');

  // ===== HANDLE SIGNUP SUBMIT =====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Show onboarding step
      setShowOnboarding(true);
    }
  };

  // ===== HANDLE ONBOARDING SUBMIT =====
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingLoading(true);
    setOnboardingError('');
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      // Create Tenant/org
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: name || 'My Gym'
        })
        .select('id')
        .single();
      if (tenantError) throw new Error(tenantError.message);
      // Create Membership (user as admin)
      await supabase.from('memberships').insert({
        user_id: user.id,
        tenant_id: tenantData.id,
        role: 'admin'
      });
      // Update user metadata with tenantId
      await supabase.auth.updateUser({ data: { tenant_id: tenantData.id } });
      // Redirect to subscribe or dashboard
      navigate('/subscribe');
    } catch (err: any) {
      setOnboardingError(err.message || 'Failed to set up gym.');
    }
    setOnboardingLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased text-blue-900 bg-gradient-to-br from-white to-blue-50">
      {/* ===== LANGUAGE SWITCHER TOP RIGHT ===== */}
      <div className="absolute top-8 right-8 z-10">
        <LanguageSwitcher />
      </div>

      {/* ===== SIGNUP CARD ===== */}
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
        <h1 className="text-2xl font-bold mb-2 text-blue-900">{t('signup.title', 'Create your account')}</h1>
        <p className="text-blue-400 mb-8 text-base">{t('signup.subtitle', 'Sign up to get started!')}</p>

        {/* ===== SIGNUP FORM ===== */}
        <form className="w-full flex flex-col gap-6" onSubmit={handleSignup}>
          {/* Name Field */}
          <div className="relative">
            <input
              type="text"
              id="name"
              className="peer w-full px-4 pt-6 pb-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-transparent"
              placeholder={t('signup.name', 'Full name')}
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="name" className="absolute left-4 top-2 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
              {t('signup.name', 'Full name')}
            </label>
          </div>
          {/* Email Field */}
          <div className="relative">
            <input
              type="email"
              id="email"
              className="peer w-full px-4 pt-6 pb-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-transparent"
              placeholder={t('signup.email', 'Email address')}
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="email" className="absolute left-4 top-2 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
              {t('signup.email', 'Email address')}
            </label>
          </div>
          {/* Password Field */}
          <div className="relative">
            <input
              type="password"
              id="password"
              className="peer w-full px-4 pt-6 pb-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-transparent"
              placeholder={t('signup.password', 'Password')}
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
            <label htmlFor="password" className="absolute left-4 top-2 text-blue-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
              {t('signup.password', 'Password')}
            </label>
          </div>
          {/* Error Message */}
          {error && <div className="text-red-500 text-sm text-center -mt-2">{error}</div>}
          {/* Signup Button */}
          <motion.button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 ease-in-out min-h-[44px]"
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            disabled={loading}
          >
            {t('signup.button', 'Create Account')}
          </motion.button>
        </form>

        {/* Link to Login */}
        <div className="mt-8 text-blue-400 text-sm">
          {t('signup.have_account', 'Already have an account?')}{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-600 underline transition">{t('signup.login', 'Sign In')}</Link>
        </div>
        {/* Back to Home Link */}
        <Link to="/" className="mt-4 text-blue-400 hover:text-blue-600 text-sm underline transition">{t('signup.back', '← Back to Home')}</Link>
      </motion.div>

      {showOnboarding && (
        <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased text-blue-900 bg-gradient-to-br from-white to-blue-50">
          <motion.div
            className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl border border-blue-100 px-12 py-14 flex flex-col items-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0.1, 0.2, 1] }}
          >
            <div className="mb-8">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-[#0D1F85] via-[#155FD9] via-[#489BFA] to-[#7BBDFE] bg-clip-text text-transparent select-none tracking-tight" style={{letterSpacing: '-0.02em'}}>MTDRB</span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-blue-900">Gym Setup</h1>
            <p className="text-blue-400 mb-8 text-base">Let's customize your gym's experience.</p>
            <form className="w-full flex flex-col gap-6" onSubmit={handleOnboarding}>
              {onboardingError && <div className="text-red-500 text-sm text-center -mt-2">{onboardingError}</div>}
              <button type="submit" className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition">
                Continue
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
} 