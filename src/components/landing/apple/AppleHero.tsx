import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { LANDING_CONTENT } from "../../../lib/constants/landingPage";

/**
 * Apple-style Hero Section
 * Premium, minimalist design with parallax image effect
 * Follows Apple.com design principles
 */
const AppleHero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax effect for hero image
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [0, 100]
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [1, 1.1]
  );
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.3]);

  const { hero } = LANDING_CONTENT;

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-apple-light"
    >
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full text-center pt-32 pb-24">
        <div className="space-y-8">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none tracking-tight text-gray-900"
            style={{
              fontFeatureSettings: '"kern" 1',
              letterSpacing: "-0.02em",
            }}
          >
            {hero.headline.primary}
            <br />
            <span className="text-gray-600">{hero.headline.secondary}</span>
          </motion.h1>

          {/* Subtitle with fade-in */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1.2,
              delay: prefersReducedMotion ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-xl sm:text-2xl lg:text-3xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-light"
          >
            {hero.subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1.2,
              delay: prefersReducedMotion ? 0 : 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            {/* Primary Button - Apple Blue */}
            <Link to={hero.cta.primary.href}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-appleBlue-500 text-white rounded-full text-lg font-medium hover:bg-appleBlue-600 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-appleBlue-500/30 min-h-[44px] shadow-lg cursor-pointer"
                aria-label="Book a demo of MTDRB platform"
              >
                {hero.cta.primary.text}
              </motion.div>
            </Link>

            {/* Secondary Link - Apple Style */}
            {hero.cta.secondary.href.startsWith("#") ? (
              <motion.a
                href={hero.cta.secondary.href}
                whileHover={prefersReducedMotion ? {} : { x: 4 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2 text-lg text-appleBlue-500 hover:text-appleBlue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-appleBlue-500/30 focus:ring-offset-2 rounded-lg px-2 py-1"
                aria-label="Explore MTDRB platform features"
              >
                {hero.cta.secondary.text}
                <FiArrowRight className="w-5 h-5" aria-hidden="true" />
              </motion.a>
            ) : (
              <Link to={hero.cta.secondary.href}>
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 text-lg text-appleBlue-500 hover:text-appleBlue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-appleBlue-500/30 focus:ring-offset-2 rounded-lg px-2 py-1 cursor-pointer"
                  aria-label="Explore MTDRB platform features"
                >
                  {hero.cta.secondary.text}
                  <FiArrowRight className="w-5 h-5" aria-hidden="true" />
                </motion.div>
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Hero Image with Parallax */}
      <motion.div
        ref={imageRef}
        style={{
          y: imageY,
          scale: imageScale,
          opacity: imageOpacity,
        }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/mockups/idara-dashboard.png"
            alt="MTDRB Dashboard Preview"
            className="w-full max-w-6xl h-auto object-contain"
            loading="eager"
            style={{
              filter: "drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.25))",
            }}
          />
        </div>
      </motion.div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-apple-light via-apple-light/80 to-apple-light z-[1]" />
    </section>
  );
};

export default AppleHero;

