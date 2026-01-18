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
  FiZap,
} from "react-icons/fi";

const PremiumLanding: React.FC = () => {
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-[#0033A0] to-[#40C4FF] bg-clip-text text-transparent"
            >
              MTDRB
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Features
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
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
              >
                Solutions
              </a>
              <a
                href="#pricing"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Pricing
              </a>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-slate-600">
                <span>EN</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400">AR</span>
              </div>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600"
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
            className="md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-4"
          >
            <a
              href="#features"
              className="block text-slate-600 hover:text-slate-900 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
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
              Solutions
            </a>
            <a
              href="#pricing"
              className="block text-slate-600 hover:text-slate-900 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <div className="pt-4 border-t border-slate-200">
              <Link to="/signup" className="block">
                <button className="w-full px-6 py-2.5 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl">
                  Get Started
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
                The Gym Operating System{" "}
                <span className="bg-gradient-to-r from-[#0033A0] to-[#40C4FF] bg-clip-text text-transparent">
                  Built for the GCC
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-slate-600 mb-8 leading-relaxed"
              >
                Streamline your fitness business with the only platform that
                speaks your language. Manage bookings, memberships, and VAT
                compliance in one unified dashboard.
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
                    className="px-8 py-4 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Start Free Trial
                    <FiArrowRight className="w-5 h-5" />
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
                  See How It Works
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
                  alt="MTDRB Dashboard Preview"
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
              Global Standards. Local Logic.
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built specifically for the GCC region with regional business logic
              and compliance built-in.
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
                Bilingual Core
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Switch seamlessly between English and Arabic. Full RTL support
                with culturally-aware interface design.
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
                VAT Compliant
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Automated tax reporting designed for Gulf regulations. Generate
                VAT reports with one click, fully compliant with GCC standards.
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
                Unified Billing
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Accept payments via local gateways (Mada, KNET, Benefit). All
                transactions processed securely with regional payment
                preferences.
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
              Everything You Need to Run Your Gym
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to streamline operations and boost
              member satisfaction.
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
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiCalendar className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Smart Scheduling
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Stop juggling calendars. Our system detects room conflicts and
                manages waitlists automatically. Recurring classes, trainer
                availability, and capacity management—all handled seamlessly.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Automatic conflict detection</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Intelligent waitlist management</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Recurring class patterns</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
              <img
                src="/Calendar.png"
                alt="Smart Scheduling Calendar"
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
                alt="Member Retention Analytics Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiTrendingUp className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Member Retention
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Data-driven insights track attendance. The system flags members
                who haven't visited in 14 days, enabling proactive engagement
                before they churn.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Automated attendance tracking</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Churn risk identification</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Engagement scoring</span>
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
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-[#0033A0]/10 to-[#40C4FF]/10 rounded-xl flex items-center justify-center mb-6">
                <FiDollarSign className="w-7 h-7 text-[#0033A0]" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Financial Command
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Track every Riyal and Dirham with precise expense
                categorization. Automated invoicing, payment processing, and
                comprehensive financial reporting.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Automated invoicing</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Multi-currency support</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Real-time financial insights</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
              <img
                src="/Billing.png"
                alt="Financial Command Dashboard"
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
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your gym. All plans include core
              features with no hidden fees.
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
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">80</span>
                <span className="text-slate-600"> USD/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>All core features</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Single location</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>+$20 USD per extra location</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Email support</span>
                </li>
              </ul>
              <button className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 transition-all duration-200">
                Get Started
              </button>
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
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">130</span>
                <span className="text-slate-600"> USD/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>$10 USD per extra location</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Unlimited members</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <FiCheck className="w-5 h-5 text-[#40C4FF]" />
                  <span>WhatsApp bot</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-[#0033A0] to-[#40C4FF] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Get Started
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
                The gym operating system built for the GCC region.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
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
                    Features
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
                    Pricing
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
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    About
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    Blog
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    Careers
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    Documentation
                  </span>
                </li>
                <li>
                  <span className="text-slate-500 cursor-not-allowed">
                    Help Center
                  </span>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>© 2025 MTDRB. Made for the Gulf.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumLanding;

