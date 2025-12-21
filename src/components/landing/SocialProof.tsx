import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiStar } from "react-icons/fi";
import { LANDING_CONTENT } from "../../lib/constants/landingPage";
import { SmartCard } from "../ui/DesignSystem";

/**
 * Social Proof Section Component
 * Testimonials and statistics to build trust
 * Enhanced with accessibility and reduced motion support
 */
const SocialProof: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const { socialProof } = LANDING_CONTENT;

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-white"
      aria-labelledby="social-proof-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={
            isInView && !prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1 }
          }
          transition={{ duration: prefersReducedMotion ? 0 : 1 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2
            id="social-proof-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-900 mb-4 sm:mb-6"
          >
            {socialProof.headline}
          </h2>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={
            isInView && !prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1 }
          }
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            delay: prefersReducedMotion ? 0 : 0.2,
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20"
          role="list"
          aria-label="Platform statistics"
        >
          {socialProof.stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                isInView && !prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 1 }
              }
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: prefersReducedMotion ? 0 : 0.3 + index * 0.1,
              }}
              className="text-center"
              role="listitem"
            >
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mtdrb-600 mb-2"
                aria-label={`${stat.value} ${stat.label}`}
              >
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          role="list"
          aria-label="Customer testimonials"
        >
          {socialProof.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={
                isInView && !prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1 }
              }
              transition={{
                duration: prefersReducedMotion ? 0 : 0.8,
                delay: prefersReducedMotion ? 0 : 0.4 + index * 0.1,
              }}
              role="listitem"
            >
              <SmartCard
                hover
                className="h-full p-6 sm:p-8 bg-white border border-gray-200/50 rounded-3xl hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-mtdrb-500 focus-within:ring-offset-2"
                role="article"
                aria-labelledby={`testimonial-${index}-author`}
              >
                {/* Rating Stars */}
                <div
                  className="flex items-center gap-1 mb-4"
                  role="img"
                  aria-label={`${testimonial.rating} out of 5 stars`}
                >
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <FiStar
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 fill-mtdrb-500 text-mtdrb-500"
                      aria-hidden="true"
                    />
                  ))}
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
                  <p>"{testimonial.content}"</p>
                </blockquote>

                {/* Author */}
                <div className="border-t border-gray-200/50 pt-4">
                  <div
                    id={`testimonial-${index}-author`}
                    className="font-semibold text-gray-900 text-sm sm:text-base"
                  >
                    {testimonial.name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">
                    {testimonial.role}
                  </div>
                </div>
              </SmartCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;

