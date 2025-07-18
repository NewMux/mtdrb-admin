import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="w-full bg-white/90 backdrop-blur border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#0D1F85] via-[#155FD9] via-[#489BFA] to-[#7BBDFE] bg-clip-text text-transparent select-none" style={{letterSpacing: '-0.02em'}}>MTDRB</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-blue-900 font-medium hover:text-blue-500 transition">{t('navbar.features', 'Features')}</a>
          <a href="#how" className="text-blue-900 font-medium hover:text-blue-500 transition">{t('navbar.how', 'How it works')}</a>
          <a href="#pricing" className="text-blue-900 font-medium hover:text-blue-500 transition">{t('navbar.pricing', 'Pricing')}</a>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ease-in-out min-h-[44px] flex items-center">Login</Link>
        </div>
      </div>
    </nav>
  );
} 