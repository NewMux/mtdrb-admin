import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

// ===== SUBSCRIBE PAGE (DUMMY) =====
export default function Subscribe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check auth and paid status on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      console.log('Fetched user on mount:', data.user);
      if (!data.user) {
        navigate('/login');
        return;
      }
      setUser(data.user);
      // Check paid status - preserve original destination
      if (data.user.user_metadata && data.user.user_metadata.paid) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from);
        return;
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [navigate, location.state]);

  // Dummy subscribe handler
  const handleSubscribe = async () => {
    console.log('Subscribe button clicked');
    setSubscribing(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ data: { paid: true } });
      console.log('updateUser result error:', error);
      if (error) {
        setError(error.message);
      } else {
        const { data } = await supabase.auth.getUser();
        console.log('User after update:', data.user);
        if (data.user && data.user.user_metadata && data.user.user_metadata.paid) {
          const from = (location.state as any)?.from?.pathname || '/dashboard';
          navigate(from);
        }
      }
    } catch (e) {
      setError('Unexpected error');
      console.error('Subscribe error:', e);
    }
    setSubscribing(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased text-blue-900 bg-gradient-to-br from-white to-blue-50">
      {/* ===== SUBSCRIBE CARD ===== */}
      <motion.div
        className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl border border-blue-100 px-12 py-14 flex flex-col items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0.1, 0.2, 1] }}
      >
        <div className="mb-8">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-[#0D1F85] via-[#155FD9] via-[#489BFA] to-[#7BBDFE] bg-clip-text text-transparent select-none tracking-tight" style={{letterSpacing: '-0.02em'}}>MTDRB</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-blue-900">Subscribe to Continue</h1>
        <p className="text-blue-400 mb-8 text-base text-center">This is a dummy paywall. Click below to simulate payment and unlock your dashboard.</p>
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}
        <motion.button
          onClick={handleSubscribe}
          className="w-full py-4 bg-gradient-to-r from-[#155FD9] via-[#489BFA] to-[#7BBDFE] hover:from-[#489BFA] hover:to-[#155FD9] text-white font-semibold rounded-lg text-lg shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
          whileHover={{ scale: subscribing ? 1 : 1.03 }}
          whileTap={{ scale: subscribing ? 1 : 0.97 }}
          disabled={subscribing}
        >
          {subscribing ? 'Subscribing...' : 'Subscribe Now (Dummy)'}
        </motion.button>
        <Link to="/" className="mt-8 text-blue-400 hover:text-blue-600 text-sm underline transition">← Back to Home</Link>
      </motion.div>
    </div>
  );
} 