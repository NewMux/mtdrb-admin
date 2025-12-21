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
import { LANDING_CONTENT } from "../../lib/constants/landingPage";
import { SmartCard } from "../ui/DesignSystem";

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
 * Features Section Component
 * Modern Bento Grid layout showcasing key features
 */
const Features: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const { features } = LANDING_CONTENT;

  // Define grid layout - some features take more space
  const gridLayout = [
    { span: "col-span-1 md:col-span-2" }, // First feature spans 2 columns
    { span: "col-span-1" },
    { span: "col-span-1" },
    { span: "col-span-1" },
    { span: "col-span-1" },
    { span: "col-span-1 md:col-span-2" }, // Last feature spans 2 columns
    { span: "col-span-1" },
    { span: "col-span-1" },
  ];

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-20 sm:py-24 lg:py-32 bg-white"
      aria-labelledby="features-heading"
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
          className="text-center mb-16 sm:mb-20"
        >
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-4 sm:mb-6"
          >
            {features.headline}
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {features.subtitle}
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.items.map((feature, index) => {
            const IconComponent = iconMap[feature.icon];
            const layout = gridLayout[index] || { span: "col-span-1" };

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView && !prefersReducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 1 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.6,
                  delay: prefersReducedMotion ? 0 : index * 0.1,
                }}
                className={layout.span}
              >
                <SmartCard
                  hover
                  className="h-full p-6 sm:p-8 bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 rounded-3xl hover:shadow-xl transition-all duration-300 group focus-within:ring-2 focus-within:ring-mtdrb-500 focus-within:ring-offset-2"
                  tabIndex={0}
                  role="article"
                  aria-labelledby={`feature-${index}-title`}
                >
                  {/* Icon */}
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-mtdrb-500/10 to-mtdrb-600/10 rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300"
                    aria-hidden="true"
                  >
                    {IconComponent && (
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-mtdrb-600" />
                    )}
                  </div>

                  {/* Content */}
                  <h3
                    id={`feature-${index}-title`}
                    className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3"
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Category Badge */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200/50">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-mtdrb-50 text-mtdrb-700 border border-mtdrb-200/50"
                      aria-label={`Category: ${feature.category}`}
                    >
                      {feature.category}
                    </span>
                  </div>
                </SmartCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

