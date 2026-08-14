import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiCheck, FiCircle } from "react-icons/fi";

/**
 * Roadmap / Building in Public Section
 * Shows development progress with step indicators
 * Uses Luna design system
 */
const RoadmapSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const roadmapSteps = [
    { id: "concept", label: "Concept", status: "completed" },
    { id: "design", label: "Design", status: "completed" },
    { id: "development", label: "Core Development", status: "completed" },
    { id: "beta", label: "Beta Testing", status: "current" },
    { id: "launch", label: "GCC Launch", status: "upcoming" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32 bg-lunaLight/10"
      aria-labelledby="roadmap-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
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
          className="text-center mb-16"
        >
          <h2
            id="roadmap-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tighter text-lunaNavy mb-6"
            style={{
              fontFeatureSettings: '"kern" 1',
              letterSpacing: "-0.04em",
            }}
          >
            We Are Building the Beast
          </h2>
          <p className="text-xl sm:text-2xl text-lunaNavy/80 max-w-3xl mx-auto leading-tight font-medium">
            Idara is currently in private beta with select GCC brands. The public launch will change the industry standard forever.
          </p>
          
          {/* System Status Label */}
          <div className="mt-8">
            <p className="text-sm font-semibold text-lunaCyan uppercase tracking-wide">
              System Status: Finalizing Core Architecture
            </p>
          </div>
        </motion.div>

        {/* Roadmap Steps */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-lunaLight/40 rounded-full hidden sm:block" />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={
              isInView && !prefersReducedMotion
                ? { scaleX: 1 }
                : { scaleX: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 1.5,
              delay: prefersReducedMotion ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute top-6 left-0 h-1 bg-lunaCyan rounded-full hidden sm:block"
            style={{
              width: "75%", // 3 out of 4 completed steps (75%)
              transformOrigin: "left",
            }}
          />

          {/* Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-4 relative">
            {roadmapSteps.map((step, index) => {
              const isCompleted = step.status === "completed";
              const isCurrent = step.status === "current";
              const isUpcoming = step.status === "upcoming";

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView && !prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 1 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.5,
                    delay: prefersReducedMotion ? 0 : 0.08 * index,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Step Indicator */}
                  <div className="relative mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-lunaCyan text-white shadow-lg"
                          : isCurrent
                          ? "bg-lunaCyan text-white shadow-lg ring-4 ring-lunaCyan/30 animate-pulse"
                          : "bg-lunaLight/40 text-lunaNavy/40"
                      }`}
                    >
                      {isCompleted ? (
                        <FiCheck className="w-6 h-6" aria-hidden="true" />
                      ) : (
                        <FiCircle className="w-6 h-6" aria-hidden="true" />
                      )}
                    </div>
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-lunaCyan/20"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="space-y-1">
                    <h3
                      className={`text-sm sm:text-base font-semibold ${
                        isCompleted || isCurrent
                          ? "text-lunaNavy"
                          : "text-lunaNavy/40"
                      }`}
                    >
                      {step.label}
                    </h3>
                    {isCurrent && (
                      <span className="inline-block px-2 py-0.5 bg-lunaCyan/20 text-lunaCyan text-xs font-medium rounded-full">
                        Current
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="inline-block px-2 py-0.5 bg-lunaLight/40 text-lunaNavy/60 text-xs font-medium rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;

