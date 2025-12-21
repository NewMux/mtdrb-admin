import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  FiZap,
  FiBarChart2,
  FiMessageCircle,
  FiShield,
  FiUsers,
  FiCalendar,
  FiCreditCard,
  FiGlobe,
} from "react-icons/fi";
import { LANDING_CONTENT } from "../../../lib/constants/landingPage";

/**
 * Icon mapping for feature icons
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: FiZap,
  "bar-chart-2": FiBarChart2,
  "message-circle": FiMessageCircle,
  shield: FiShield,
  users: FiUsers,
  calendar: FiCalendar,
  "credit-card": FiCreditCard,
  globe: FiGlobe,
};

/**
 * Apple-style Bento Grid Features Section
 * Premium card-based layout with soft gray backgrounds
 * Follows Apple.com design principles
 */
const BentoGrid: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const { features } = LANDING_CONTENT;

  // Apple-style staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-24 lg:py-32 bg-white"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={
            isInView && !prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1 }
          }
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-center mb-20 lg:mb-24"
        >
          <h2
            id="features-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tight text-lunaNavy mb-6"
            style={{
              fontFeatureSettings: '"kern" 1',
              letterSpacing: "-0.02em",
            }}
          >
            Sneak Peek
          </h2>
          <p className="text-xl sm:text-2xl text-lunaNavy/70 max-w-3xl mx-auto leading-relaxed font-light">
            A preview of what's coming in 2025
          </p>
        </motion.div>

        {/* Bento Grid - 3 columns */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.items.map((feature, index) => {
            const IconComponent = iconMap[feature.icon];
            // Some cards span 2 columns for visual interest
            const spanClass =
              index === 0 || index === 4
                ? "md:col-span-2 lg:col-span-1"
                : "";

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={spanClass}
              >
                <div className="h-full p-8 bg-lunaLight/20 rounded-3xl border border-lunaLight/40 hover:shadow-2xl transition-all duration-500 group focus-within:ring-4 focus-within:ring-lunaCyan/20 focus-within:ring-offset-2">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {IconComponent && (
                        <IconComponent className="w-7 h-7 text-lunaCyan" />
                      )}
                    </div>
                  </div>

                  {/* Content - Bottom aligned for Apple aesthetic */}
                  <div className="flex flex-col h-full">
                    <div className="flex-grow" />
                    <div>
                      {/* In Development Badge for Smart Automation */}
                      {feature.category === "automation" && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-lunaLight/40 text-lunaNavy border border-lunaLight/60">
                            In Development
                          </span>
                        </div>
                      )}
                      <h3 className="text-2xl sm:text-3xl font-bold text-lunaNavy mb-3 leading-tight tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-base sm:text-lg text-lunaNavy/70 leading-relaxed mb-6">
                        {feature.description.startsWith("Will ") 
                          ? feature.description 
                          : `Will ${feature.description.toLowerCase()}`}
                      </p>

                      {/* Category Badge */}
                      <div className="pt-4 border-t border-lunaNavy/10">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-lunaLight/30 text-lunaNavy border border-lunaLight/50">
                          {feature.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default BentoGrid;

