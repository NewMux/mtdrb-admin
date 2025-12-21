import React, { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiCheck, FiMail } from "react-icons/fi";

/**
 * Pre-Launch Pricing Section
 * Shows pricing with disabled buttons and waitlist CTAs
 * Uses Luna design system
 */
const PreLaunchPricing: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 79,
      yearlyPrice: 59,
      description: "Perfect for single-location gyms",
      features: [
        "All core features",
        "Single location",
        "Up to 500 members",
        "Basic analytics",
        "Email support",
        "WhatsApp Assistant bot",
      ],
      popular: false,
    },
    {
      name: "Pro",
      monthlyPrice: 109,
      yearlyPrice: 89,
      description: "For growing gym chains",
      features: [
        "Everything in Starter",
        "Unlimited locations",
        "Unlimited members",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "Biometric access",
        "White-label options",
      ],
      popular: true,
    },
  ];

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
      className="relative py-20 sm:py-24 lg:py-32 bg-white"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Early Access Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={
            isInView && !prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1 }
          }
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="max-w-3xl mx-auto mb-12 p-6 bg-lunaLight/30 border-2 border-lunaCyan/30 rounded-2xl text-center"
        >
          <p className="text-lg font-semibold text-lunaNavy">
            Early waitlist members get <span className="text-lunaCyan">3 months of Pro features free</span>.
            <br />
            <span className="text-base font-medium text-lunaNavy/80 mt-2 block">
              Join the waitlist to lock in these launch prices.
            </span>
          </p>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={
            isInView && !prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 1 }
          }
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2
            id="pricing-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tighter text-lunaNavy mb-4 sm:mb-6"
            style={{ letterSpacing: "-0.04em" }}
          >
            Costs Less Than Your Cleaning Bill
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-lunaNavy/80 max-w-3xl mx-auto leading-tight font-medium mb-8 sm:mb-12">
            Transparent pricing. No surprises. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4" role="group" aria-label="Billing period selector">
            <span
              className={`text-base sm:text-lg font-medium transition-colors ${
                !isYearly ? "text-lunaNavy" : "text-lunaNavy/40"
              }`}
              aria-hidden="true"
            >
              Monthly
            </span>
            <button
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              className={`relative w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-lunaCyan focus:ring-offset-2 min-h-[44px] min-w-[64px] ${
                isYearly ? "bg-lunaCyan" : "bg-lunaNavy/20"
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
                isYearly ? "text-lunaNavy" : "text-lunaNavy/40"
              }`}
              aria-hidden="true"
            >
              Yearly{" "}
              {isYearly && (
                <span className="text-lunaCyan">(Save 25%)</span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto"
          role="list"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={
                isInView && !prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1 }
              }
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: prefersReducedMotion ? 0 : 0.1 + index * 0.1,
              }}
              className={`relative rounded-3xl p-6 sm:p-8 lg:p-10 focus-within:ring-4 focus-within:ring-lunaCyan focus-within:ring-offset-2 ${
                plan.popular
                  ? "bg-lunaLight/20 border-2 border-lunaCyan/30 shadow-xl"
                  : "bg-lunaLight/10 border border-lunaLight/40 shadow-lg"
              }`}
              role="listitem"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span
                    className="bg-lunaCyan text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                    aria-label="Most popular plan"
                  >
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-lunaNavy mb-2">
                  {plan.name}
                </h3>
                <p className="text-lunaNavy/80 font-medium mb-4 sm:mb-6">
                  {plan.name === "Starter" 
                    ? "For operators ready to get serious."
                    : "For brands dominating their market."}
                </p>

                <div className="mb-4 sm:mb-6">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-lunaNavy">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-lunaNavy/50 ml-2 text-lg sm:text-xl">
                    /month
                  </span>
                </div>

                {isYearly && (
                  <p
                    className="text-sm sm:text-base text-lunaCyan font-medium mb-4"
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
                      className="w-5 h-5 sm:w-6 sm:h-6 text-lunaCyan flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm sm:text-base text-lunaNavy/80 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Disabled Button with Waitlist CTA */}
              <motion.button
                disabled
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`w-full py-3 sm:py-4 rounded-full font-semibold text-center transition-all duration-300 min-h-[48px] flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-lunaCyan focus:ring-offset-2 cursor-not-allowed ${
                  plan.popular
                    ? "bg-lunaMid/50 text-white/70 shadow-lg"
                    : "bg-lunaNavy/20 text-lunaNavy/50 border border-lunaNavy/20"
                }`}
                aria-label={`Join waitlist for ${plan.name} plan`}
              >
                <FiMail className="w-4 h-4" aria-hidden="true" />
                {plan.popular ? "Join Waitlist for Pro" : "Get Notified"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PreLaunchPricing;

