import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { FiMenu, FiX, FiChevronRight } from "react-icons/fi";
import { LANDING_CONTENT } from "../../../lib/constants/landingPage";

/**
 * Apple-style Navigation Component
 * Premium navigation with glassmorphism, smooth animations, and excellent UX
 * Features:
 * - Center-aligned navigation links (Apple.com style)
 * - Refined glassmorphism on scroll
 * - Full-screen mobile menu that slides from right
 * - Active link detection
 * - Smooth scroll behavior
 */
const AppleNavigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const navRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const { navigation } = LANDING_CONTENT;

  // Detect scroll position for glassmorphism effect
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setIsScrolled(latest > 0.05);
  });

  // Detect active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigation.links
        .filter((link) => link.href.startsWith("#"))
        .map((link) => link.href.substring(1));

      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navigation.links]);

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

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const elementPosition =
          element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navHeight - 20;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        setIsMenuOpen(false);
      }
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? "bg-white/90 backdrop-blur-2xl border-b border-lunaNavy/10 shadow-sm"
            : "bg-white"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo - Left */}
            <a
              href={navigation.logo.href}
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2 rounded-xl p-1.5 -m-1.5 transition-all duration-200"
              aria-label="Idara Home"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-lunaCyan to-lunaMid rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <span
                  className="text-white font-bold text-sm"
                  aria-hidden="true"
                >
                  I
                </span>
              </div>
              <span className="text-lg font-semibold text-lunaNavy tracking-tight">
                Idara
              </span>
              {/* Beta Badge */}
              <span className="px-2.5 py-1 bg-lunaLight/30 text-lunaNavy text-xs font-medium rounded-full border border-lunaLight/50">
                Beta Access Soon
              </span>
            </a>

            {/* Desktop Navigation - Center (Apple.com style) */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.links.map((link) => {
                const isActive = activeSection === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2 ${
                      isActive
                        ? "text-lunaNavy"
                        : "text-lunaNavy/70 hover:text-lunaNavy"
                    }`}
                    aria-label={`Navigate to ${link.text} section`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.text}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-lunaCyan rounded-full"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </a>
                );
              })}
            </div>

            {/* Desktop CTA - Right */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                to={navigation.cta.signIn.href}
                className="px-4 py-2 text-sm font-medium text-lunaNavy/70 hover:text-lunaNavy transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2 rounded-lg"
                aria-label="Sign in to your account"
              >
                {navigation.cta.signIn.text}
              </Link>
              <Link to={navigation.cta.getStarted.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-lunaMid text-white rounded-full text-sm font-medium hover:bg-lunaMid/90 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-lunaCyan/30 focus:ring-offset-2 shadow-sm hover:shadow-md cursor-pointer"
                  aria-label="Join waitlist"
                >
                  Join Waitlist
                </motion.div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-lunaNavy p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2 rounded-xl transition-colors duration-200 hover:bg-lunaLight/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? (
                  <FiX className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <FiMenu className="w-6 h-6" aria-hidden="true" />
                )}
              </motion.div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Full Screen Overlay (Slides from right like Apple modals) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 lg:hidden shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between h-16 px-6 border-b border-lunaNavy/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-lunaCyan to-lunaMid rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">I</span>
                  </div>
                  <span className="text-base font-semibold text-lunaNavy">
                    Idara
                  </span>
                  <span className="px-2 py-0.5 bg-lunaLight/30 text-lunaNavy text-xs font-medium rounded-full border border-lunaLight/50">
                    Beta
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-lunaLight/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2"
                  aria-label="Close menu"
                >
                  <FiX className="w-5 h-5 text-lunaNavy" />
                </button>
              </div>

              {/* Menu Content */}
              <nav className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="px-6 py-8 space-y-2">
                  {navigation.links.map((link, index) => {
                    const isActive = activeSection === link.href;
                    return (
                      <motion.a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => {
                          handleSmoothScroll(e, link.href);
                          setIsMenuOpen(false);
                        }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                        }}
                        className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2 ${
                          isActive
                            ? "bg-lunaLight/30 text-lunaCyan"
                            : "text-lunaNavy hover:bg-lunaLight/20"
                        }`}
                        role="menuitem"
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span>{link.text}</span>
                        <FiChevronRight
                          className={`w-5 h-5 transition-transform duration-200 ${
                            isActive
                              ? "text-lunaCyan"
                              : "text-lunaNavy/40 group-hover:translate-x-1"
                          }`}
                          aria-hidden="true"
                        />
                      </motion.a>
                    );
                  })}
                </div>

                {/* Mobile CTA Section */}
                <div className="mt-auto px-6 py-6 space-y-3 border-t border-lunaNavy/10">
                  <a
                    href={navigation.cta.signIn.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-base font-medium text-lunaNavy rounded-xl hover:bg-lunaLight/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lunaCyan/30 focus:ring-offset-2"
                    role="menuitem"
                  >
                    {navigation.cta.signIn.text}
                  </a>
                  <motion.a
                    href={navigation.cta.getStarted.href}
                    onClick={() => setIsMenuOpen(false)}
                    whileTap={{ scale: 0.98 }}
                    className="block w-full px-4 py-3.5 text-center text-base font-medium bg-lunaMid text-white rounded-full hover:bg-lunaMid/90 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-lunaCyan/30 focus:ring-offset-2 shadow-sm"
                    role="menuitem"
                  >
                    Join Waitlist
                  </motion.a>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppleNavigation;
