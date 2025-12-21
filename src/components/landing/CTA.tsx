import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { LANDING_CONTENT } from "../../lib/constants/landingPage";

/**
 * CTA Section Component
 * Final call-to-action section before footer
 * Enhanced with accessibility and reduced motion support
 */
const CTA: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const { cta } = LANDING_CONTENT;

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-mtdrb-600 to-mtdrb-700 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={
            isInView && !prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1 }
          }
          transition={{ duration: prefersReducedMotion ? 0 : 1 }}
          className="space-y-8 sm:space-y-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white">
            {cta.headline}
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            {cta.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-4 sm:pt-8">
            <Link to={cta.primary.href}>
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 bg-white text-mtdrb-600 rounded-full text-lg sm:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-mtdrb-600 min-h-[56px] cursor-pointer"
                aria-label="Start your free trial of MTDRB"
              >
                <span>{cta.primary.text}</span>
                <FiArrowRight
                  className="ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-200"
                  aria-hidden="true"
                />
              </motion.div>
            </Link>

            {cta.secondary.href.startsWith("/") ? (
              <Link to={cta.secondary.href}>
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 border-2 border-white/30 text-white rounded-full text-lg sm:text-xl font-semibold hover:border-white/50 hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-mtdrb-600 min-h-[56px] cursor-pointer"
                  aria-label="Schedule a demo of MTDRB platform"
                >
                  {cta.secondary.text}
                </motion.div>
              </Link>
            ) : (
              <motion.a
                href={cta.secondary.href}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 border-2 border-white/30 text-white rounded-full text-lg sm:text-xl font-semibold hover:border-white/50 hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-mtdrb-600 min-h-[56px]"
                aria-label="Schedule a demo of MTDRB platform"
              >
                {cta.secondary.text}
              </motion.a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;

