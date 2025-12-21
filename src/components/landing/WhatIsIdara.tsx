import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiMonitor, FiMessageCircle, FiShield } from "react-icons/fi";
import { LANDING_CONTENT } from "../../lib/constants/landingPage";
import { SmartCard } from "../ui/DesignSystem";

/**
 * Icon mapping for pillars
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  monitor: FiMonitor,
  "message-circle": FiMessageCircle,
  shield: FiShield,
};

/**
 * WhatIsIdara Section Component
 * Three pillars of the platform
 */
const WhatIsIdara: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { whatIsIdara } = LANDING_CONTENT;

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-center mb-16 sm:mb-24"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight mb-4 sm:mb-8">
            {whatIsIdara.headline}
          </h2>
        </motion.div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
          {whatIsIdara.pillars.map((pillar, index) => {
            const IconComponent = iconMap[pillar.icon];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
                className="text-center"
              >
                <SmartCard
                  hover
                  className="h-full p-6 sm:p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 sm:mb-8">
                    {IconComponent && (
                      <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                    {pillar.title}
                  </h3>

                  <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed max-w-sm mx-auto">
                    {pillar.description}
                  </p>
                </SmartCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatIsIdara;

