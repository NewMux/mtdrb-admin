import React, { useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import { LANDING_CONTENT } from "../../lib/constants/landingPage";

/**
 * Pricing Section Component
 * Clean pricing cards with toggle for monthly/yearly billing
 * Enhanced with accessibility and keyboard navigation
 */
const Pricing: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [isYearly, setIsYearly] = useState(false);

  const { pricing } = LANDING_CONTENT;

  const handleToggle = () => {
    setIsYearly(!isYearly);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-white"
      aria-labelledby="pricing-heading"
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
            id="pricing-heading"
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-4 sm:mb-6"
          >
            {pricing.headline}
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-12">
            {pricing.subtitle}
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4" role="group" aria-label="Billing period selector">
            <span
              className={`text-base sm:text-lg font-medium transition-colors ${
                !isYearly ? "text-gray-900" : "text-gray-400"
              }`}
              aria-hidden="true"
            >
              {pricing.toggle.monthly}
            </span>
            <button
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              className={`relative w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-mtdrb-500 focus:ring-offset-2 min-h-[44px] min-w-[64px] ${
                isYearly ? "bg-mtdrb-600" : "bg-gray-300"
              }`}
              aria-label={`Switch to ${isYearly ? "monthly" : "yearly"} billing`}
              aria-pressed={isYearly}
              role="switch"
            >
              <motion.div
                className="absolute top-0.5 sm:top-1 w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full shadow-lg"
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        x: isYearly ? 28 : 2,
                      }
                }
                transition={
                  prefersReducedMotion
                    ? {}
                    : {
                        duration: 0.3,
                        type: "spring",
                        stiffness: 500,
                      }
                }
                style={prefersReducedMotion ? { x: isYearly ? 28 : 2 } : undefined}
              />
            </button>
            <span
              className={`text-base sm:text-lg font-medium transition-colors ${
                isYearly ? "text-gray-900" : "text-gray-400"
              }`}
              aria-hidden="true"
            >
              {pricing.toggle.yearly}{" "}
              {isYearly && (
                <span className="text-mtdrb-600">{pricing.toggle.savings}</span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto"
          role="list"
        >
          {pricing.plans.map((plan, index) => (
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
                delay: prefersReducedMotion ? 0 : 0.2 + index * 0.2,
              }}
              className={`relative rounded-3xl p-6 sm:p-8 lg:p-10 focus-within:ring-4 focus-within:ring-mtdrb-500 focus-within:ring-offset-2 ${
                plan.popular
                  ? "bg-gradient-to-br from-mtdrb-50 to-mtdrb-100/50 border-2 border-mtdrb-300 shadow-xl"
                  : "bg-white border border-gray-200 shadow-lg"
              }`}
              role="listitem"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span
                    className="bg-mtdrb-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                    aria-label="Most popular plan"
                  >
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4 sm:mb-6">{plan.description}</p>

                <div className="mb-4 sm:mb-6">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 ml-2 text-lg sm:text-xl">
                    /month
                  </span>
                </div>

                {isYearly && (
                  <p
                    className="text-sm sm:text-base text-mtdrb-600 font-medium mb-4"
                    aria-live="polite"
                  >
                    Billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8" role="list">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-3 sm:gap-4"
                    role="listitem"
                  >
                    <FiCheck
                      className="w-5 h-5 sm:w-6 sm:h-6 text-mtdrb-600 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <motion.div
                  whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`block w-full py-3 sm:py-4 rounded-full font-semibold text-center transition-all duration-300 min-h-[48px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-mtdrb-500 focus:ring-offset-2 ${
                    plan.popular
                      ? "bg-mtdrb-600 text-white hover:bg-mtdrb-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-900 text-white hover:bg-gray-800 border border-gray-300"
                  }`}
                  aria-label={`Get started with ${plan.name} plan`}
                >
                  {plan.cta}
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

