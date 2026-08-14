import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";

// ===== PROFILE PAGE (SCAFFOLD) =====
export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check auth and paid status on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
      } else if (!data.user.user_metadata || !data.user.user_metadata.paid) {
        navigate("/subscribe");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans antialiased text-blue-900 bg-gradient-to-br from-white to-blue-50">
      {/* ===== PROFILE CARD ===== */}
      <motion.div
        className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl border border-blue-100 px-12 py-14 flex flex-col items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0.1, 0.2, 1] }}
      >
        <div className="mb-8">
          <img 
            src="/mtdrb-logo.svg" 
            alt="MTDRB" 
            className="h-12 w-auto mx-auto"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-blue-900">Profile</h1>
        <div className="mb-6 text-center">
          <div className="text-blue-900 font-semibold text-lg">
            {user?.user_metadata?.name || "No name set"}
          </div>
          <div className="text-blue-400 text-base">{user?.email}</div>
        </div>
        {/* Placeholder for profile editing */}
        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out min-h-[44px]">
          Save Changes
        </button>
        <Link
          to="/dashboard"
          className="mt-8 text-blue-400 hover:text-blue-600 text-sm underline transition"
        >
          ← Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
