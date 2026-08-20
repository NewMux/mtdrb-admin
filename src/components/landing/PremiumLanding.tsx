import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiArrowRight,
  FiCheck,
  FiGlobe,
  FiCreditCard,
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import { PLATFORM_CURRENCY, PRO_EXTRA_LOCATION_PRICE, STARTER_EXTRA_LOCATION_PRICE, SUBSCRIPTION_PLANS } from "../../config/runtimeConfig";

const PremiumLanding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const starterPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "starter");
  const proPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "pro");
  const currencyLabel = (starterPlan?.currency || proPlan?.currency || PLATFORM_CURRENCY).toUpperCase();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-white text-slate-900 antialiased">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`nav-ltr-layout fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
            : "bg-transparent"
        }`}
        dir="ltr"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 relative">
            {/* Logo - Left side */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#40C4FF] bg-clip-text text-transparent flex-shrink-0 z-20"
              style={{ minWidth: 'fit-content' }}
            >
              MTDRB
            </motion.div>

            {/* Desktop Navigation - Center */}
            <div className="hidden xl:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector("#pricing");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer whitespace-nowrap px-2"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("navbar.pricing")}
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector("#features");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer whitespace-nowrap px-2"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("landing.solutions")}
              </a>
              <a
                href="#features"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors whitespace-nowrap px-2"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {t("navbar.features")}
              </a>
            </div>

            {/* Actions - Right side */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 z-20">
              <LanguageSwitcher />
              <Link to="/signup" className="flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {t("landing.get_started")}
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 flex-shrink-0 z-10 absolute right-0"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector("#pricing");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                setMobileMenuOpen(false);
              }}
              className="block text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              {t("navbar.pricing")}
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector("#features");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                setMobileMenuOpen(false);
              }}
              className="block text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              {t("landing.solutions")}
            </a>
            <a
              href="#features"
              className="block text-slate-600 hover:text-slate-900 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("navbar.features")}
            </a>
            <div className="pt-4 border-t border-slate-200">
              <LanguageSwitcher />
            </div>
            <div className="pt-4 border-t border-slate-200">
              <Link to="/signup" className="block">
                <button className="w-full px-6 py-2.5 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl">
                  {t("landing.get_started")}
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0033A0]/5 via-transparent to-[#40C4FF]/5" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6"
              >
                {t("landing.hero_title")}{" "}
                <span className="bg-gradient-to-r from-[#0033A0] to-[#40C4FF] bg-clip-text text-transparent">
                  {t("landing.hero_title_highlight")}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-slate-600 mb-8 leading-relaxed"
              >
                {t("landing.hero_description")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-8 py-4 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}
                  >
                    {t("landing.startFreeTrial")}
                    <FiArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </motion.button>
                </Link>
                <motion.a
                  href="#features"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector("#features");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="px-8 py-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 transition-all duration-200"
                >
                  {t("landing.seeHowItWorks")}
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right: Dashboard Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ opacity, y }}
              className="relative"
            >
              <div className="relative rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                <img
                  src="/Dashboard.png"
                  alt={t("landing.dashboardPreview")}
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t("landing.globalStandards")}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t("landing.globalStandardsDesc")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Bilingual Core */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiGlobe className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {t("landing.bilingualCore")}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {t("landing.bilingualCoreDesc")}
              </p>
            </motion.div>

            {/* Card 2: VAT Compliant */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiShield className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {t("landing.vatCompliant")}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {t("landing.vatCompliantDesc")}
              </p>
            </motion.div>

            {/* Card 3: Unified Billing */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiCreditCard className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {t("landing.unifiedBilling")}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {t("landing.unifiedBillingDesc")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t("landing.everythingYouNeed")}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t("landing.everythingYouNeedDesc")}
            </p>
          </motion.div>

          {/* Feature 1: Smart Scheduling */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-12 items-center mb-24"
          >
            <div dir={isRTL ? "rtl" : "ltr"}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiCalendar className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className={`text-3xl font-bold text-slate-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("landing.smartScheduling")}
              </h3>
              <p className={`text-lg text-slate-600 leading-relaxed mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("landing.smartSchedulingDesc")}
              </p>
              <ul className={`space-y-3 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.automaticConflictDetection")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.intelligentWaitlistManagement")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.recurringClassPatterns")}</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
              <img
                src="/Calendar.png"
                alt={t("landing.smartSchedulingImage")}
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>

          {/* Feature 2: Member Retention */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-12 items-center mb-24"
          >
            <div className="order-2 md:order-1 relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
              <img
                src="/Members.png"
                alt={t("landing.memberRetentionImage")}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="order-1 md:order-2" dir={isRTL ? "rtl" : "ltr"}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiTrendingUp className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className={`text-3xl font-bold text-slate-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("landing.memberRetention")}
              </h3>
              <p className={`text-lg text-slate-600 leading-relaxed mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("landing.memberRetentionDesc")}
              </p>
              <ul className={`space-y-3 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.automatedAttendanceTracking")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.churnRiskIdentification")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.engagementScoring")}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Feature 3: Financial Command */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div dir={isRTL ? "rtl" : "ltr"}>
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiDollarSign className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className={`text-3xl font-bold text-slate-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("landing.financialCommand")}
              </h3>
              <p className={`text-lg text-slate-600 leading-relaxed mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t("landing.financialCommandDesc")}
              </p>
              <ul className={`space-y-3 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.automatedInvoicing")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.multiCurrencySupport")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.realTimeFinancialInsights")}</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
              <img
                src="/Billing.png"
                alt={t("landing.financialCommandImage")}
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t("landing.simpleTransparentPricing")}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t("landing.pricingDesc")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-slate-300 transition-all duration-300"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t("landing.starter")}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{starterPlan?.price ?? 0}</span>
                <span className="text-slate-600"> {currencyLabel} {t("landing.usdPerMonth")}</span>
              </div>
              <ul className={`space-y-4 mb-8 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.allCoreFeatures")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.singleLocation")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>+{STARTER_EXTRA_LOCATION_PRICE} {currencyLabel} {t("landing.usdPerMonth")} {t("landing.perExtraLocation")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.basicAnalytics")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.emailSupport")}</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 transition-all duration-200">
                  {t("landing.get_started")}
                </button>
              </Link>
            </motion.div>

            {/* Pro Plan - Highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border-2 border-[#0033A0] shadow-xl hover:shadow-2xl transition-all duration-300 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {t("landing.most_popular")}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t("landing.pro")}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{proPlan?.price ?? 0}</span>
                <span className="text-slate-600"> {currencyLabel} {t("landing.usdPerMonth")}</span>
              </div>
              <ul className={`space-y-4 mb-8 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.everythingInStarter")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>+{PRO_EXTRA_LOCATION_PRICE} {currencyLabel} {t("landing.usdPerMonth")} {t("landing.perExtraLocation")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.unlimitedMembers")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.advancedAnalytics")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.prioritySupport")}</span>
                </li>
                <li className={`flex items-center text-slate-700 ${isRTL ? 'justify-end' : ''}`}>
                  <FiCheck className={`w-5 h-5 text-[#40C4FF] flex-shrink-0 ${isRTL ? 'ml-3 order-2' : 'mr-3'}`} />
                  <span className={isRTL ? 'order-1' : ''}>{t("landing.whatsappBot")}</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  {t("landing.get_started")}
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Column 1 */}
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#40C4FF] to-white bg-clip-text text-transparent mb-4">
                MTDRB
              </div>
              <p className="text-slate-400 text-sm">
                {t("landing.footerDescription")}
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="font-semibold mb-4">{t("landing.product")}</h4>
              <ul className={`space-y-2 text-sm text-slate-400 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector("#features");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t("navbar.features")}
                  </a>
                </li>
                <li>
                  <a 
                    href="#pricing" 
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector("#pricing");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t("navbar.pricing")}
                  </a>
                </li>
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector("#features");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {t("landing.integrations")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="font-semibold mb-4">{t("landing.company")}</h4>
              <ul className={`space-y-2 text-sm text-slate-400 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    {t("landing.about")}
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    {t("landing.blog")}
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    {t("landing.careers")}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="font-semibold mb-4">{t("landing.support")}</h4>
              <ul className={`space-y-2 text-sm text-slate-400 ${isRTL ? 'space-y-reverse' : ''}`}>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    {t("landing.documentation")}
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    {t("landing.helpCenter")}
                  </span>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    {t("landing.contact")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>{t("landing.madeForGulf")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumLanding;

