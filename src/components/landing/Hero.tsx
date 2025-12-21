import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiPlay, FiMenu, FiX } from "react-icons/fi";
import { LANDING_CONTENT } from "../../lib/constants/landingPage";

/**
 * Hero Section Component
 * Modern hero section with navigation, animated content, and clear CTAs
 * Enhanced with accessibility, keyboard navigation, and performance optimizations
 */
const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { hero, navigation } = LANDING_CONTENT;

  // Handle scroll for nav background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Smooth scroll handler
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsMenuOpen(false);
      }
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-mtdrb-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-mtdrb-600/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Navigation Bar */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/80 backdrop-blur-md border-b border-white/20 shadow-lg"
            : "bg-black/20 backdrop-blur-sm border-b border-white/10"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href={navigation.logo.href}
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg p-1 -m-1 transition-all"
              aria-label="MTDRB Home"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-mtdrb-500 to-mtdrb-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm" aria-hidden="true">
                  M
                </span>
              </div>
              <span className="text-white font-bold text-xl">
                {navigation.logo.text}
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg px-2 py-1 relative group"
                  aria-label={`Navigate to ${link.text} section`}
                >
                  {link.text}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to={navigation.cta.signIn.href}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg min-h-[44px] flex items-center"
                aria-label="Sign in to your account"
              >
                {navigation.cta.signIn.text}
              </Link>
              <Link
                to={navigation.cta.getStarted.href}
                className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black min-h-[44px] flex items-center"
                aria-label="Get started with MTDRB"
              >
                {navigation.cta.getStarted.text}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6" aria-hidden="true" />
              ) : (
                <FiMenu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              className="md:hidden py-4 border-t border-white/10 overflow-hidden"
              role="menu"
              aria-label="Mobile navigation menu"
            >
              <nav className="flex flex-col space-y-4" role="menubar">
                {navigation.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      handleSmoothScroll(e, link.href);
                      setIsMenuOpen(false);
                    }}
                    className="text-white/80 hover:text-white transition-colors min-h-[44px] flex items-center px-4 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg"
                    role="menuitem"
                  >
                    {link.text}
                  </a>
                ))}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <Link
                    to={navigation.cta.signIn.href}
                    className="block px-4 py-3 text-white/80 hover:text-white transition-colors min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black rounded-lg"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navigation.cta.signIn.text}
                  </Link>
                  <Link
                    to={navigation.cta.getStarted.href}
                    className="block px-4 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors text-center min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navigation.cta.getStarted.text}
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-24">
        <div className="text-center space-y-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.8,
              delay: prefersReducedMotion ? 0 : 0.2,
            }}
            className="inline-flex items-center px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full text-sm font-medium border border-white/10"
            role="status"
            aria-label="Product category"
          >
            <FiPlay className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>{hero.badge.text}</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1,
              delay: prefersReducedMotion ? 0 : 0.4,
            }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-white"
          >
            {hero.headline.primary}
            <br />
            <span className="mtdrb-gradient-text">
              {hero.headline.secondary}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1,
              delay: prefersReducedMotion ? 0 : 0.6,
            }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
          >
            {hero.subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1,
              delay: prefersReducedMotion ? 0 : 0.8,
            }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-8"
          >
            <Link to={hero.cta.primary.href}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 bg-white text-black rounded-full text-lg sm:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black min-h-[56px] cursor-pointer"
                aria-label="Book a demo of MTDRB platform"
              >
                <span>{hero.cta.primary.text}</span>
                <FiArrowRight
                  className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-200"
                  aria-hidden="true"
                />
              </motion.div>
            </Link>

            <motion.a
              href={hero.cta.secondary.href}
              onClick={(e) => handleSmoothScroll(e, hero.cta.secondary.href)}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 border-2 border-white/20 text-white rounded-full text-lg sm:text-xl font-semibold hover:border-white/40 hover:bg-white/5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black min-h-[56px]"
              aria-label="Explore MTDRB platform features"
            >
              {hero.cta.secondary.text}
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={
          isInView && !prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }
        }
        transition={{
          duration: prefersReducedMotion ? 0 : 1,
          delay: prefersReducedMotion ? 0 : 1.2,
        }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white/40"
        aria-hidden="true"
      >
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : {
                  y: [0, 10, 0],
                }
          }
          transition={
            prefersReducedMotion
              ? {}
              : {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          className="flex flex-col items-center space-y-2"
        >
          <span className="text-sm font-light">{hero.scrollIndicator}</span>
          <FiArrowRight className="w-5 h-5 rotate-90" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;

