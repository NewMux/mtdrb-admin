import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiUsers, FiDollarSign, FiCalendar, FiZap } from "react-icons/fi";

/**
 * Aggressive Bento Grid Features Section
 * Bold, punchy copy with authoritative tone
 * Uses Luna design system
 */
const AggressiveBentoGrid: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const features = [
    {
      icon: FiUsers,
      headline: "Member Retention is Not Luck.",
      copy: "Smart system predicts churn before it happens. Automated WhatsApp flows that recover revenue while you sleep.",
      category: "intelligence",
    },
    {
      icon: FiDollarSign,
      headline: "Audit-Proof Financials.",
      copy: "Every Rial tracked. VAT compliant. No more guessing where the money went.",
      category: "compliance",
    },
    {
      icon: FiCalendar,
      headline: "Fill Every Class.",
      copy: "Smart scheduling that kills dead slots and maximizes yield per square meter.",
      category: "optimization",
    },
    {
      icon: FiZap,
      headline: "Your New COO is a Bot.",
      copy: "Idara Smart handles the grunt work. You focus on expansion.",
      category: "automation",
      inDevelopment: true,
    },
  ];

  // Apple-style staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
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
            duration: prefersReducedMotion ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-center mb-20 lg:mb-24"
        >
          <h2
            id="features-heading"
            className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-none tracking-tighter text-lunaNavy mb-6"
            style={{
              fontFeatureSettings: '"kern" 1',
              letterSpacing: "-0.04em",
            }}
          >
            Unfair Advantage
          </h2>
          <p className="text-xl sm:text-2xl text-lunaNavy/70 max-w-3xl mx-auto leading-tight font-medium">
            Stop losing revenue to empty seats.
          </p>
        </motion.div>

        {/* Bento Grid - 2x2 layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="h-full"
              >
                <div className="h-full p-8 lg:p-10 bg-lunaLight/20 rounded-3xl border border-lunaLight/40 hover:shadow-2xl transition-all duration-500 group focus-within:ring-4 focus-within:ring-lunaCyan/20 focus-within:ring-offset-2">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-7 h-7 lg:w-8 lg:h-8 text-lunaCyan" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col h-full">
                    <div className="flex-grow" />
                    <div>
                      {/* In Development Badge */}
                      {feature.inDevelopment && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-lunaLight/40 text-lunaNavy border border-lunaLight/60 uppercase tracking-wide">
                            In Development
                          </span>
                        </div>
                      )}
                      
                      {/* Aggressive Headline */}
                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tighter text-lunaNavy mb-4" style={{ letterSpacing: "-0.03em" }}>
                        {feature.headline}
                      </h3>
                      
                      {/* Punchy Copy */}
                      <p className="text-base sm:text-lg lg:text-xl text-lunaNavy/80 leading-relaxed mb-6 font-medium">
                        {feature.copy}
                      </p>

                      {/* Category Badge */}
                      <div className="pt-4 border-t border-lunaNavy/10">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-lunaLight/30 text-lunaNavy border border-lunaLight/50 uppercase tracking-wide">
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

export default AggressiveBentoGrid;

