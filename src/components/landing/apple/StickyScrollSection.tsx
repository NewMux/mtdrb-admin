import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { LANDING_CONTENT } from "../../../lib/constants/landingPage";

/**
 * Feature showcase items for sticky scroll section
 */
const showcaseItems = [
  {
    title: "Smart Automation",
    description:
      "Smart-powered workflows that handle routine tasks automatically, saving hours every day.",
    image: "/mockups/idara-dashboard.png",
    color: "from-blue-500/10 to-blue-600/10",
  },
  {
    title: "Real-Time Analytics",
    description:
      "Live dashboards and analytics that give you instant insights into your gym's performance.",
    image: "/mockups/analytics-preview.png",
    color: "from-purple-500/10 to-purple-600/10",
  },
  {
    title: "Member Management",
    description:
      "Comprehensive member profiles, attendance tracking, and engagement tools all in one place.",
    image: "/Dashboard Overview.png",
    color: "from-emerald-500/10 to-emerald-600/10",
  },
  {
    title: "Billing & Payments",
    description:
      "Automated billing, payment processing, and financial reporting with VAT compliance built-in.",
    image: "/Billing page overview tab.png",
    color: "from-rose-500/10 to-rose-600/10",
  },
];

/**
 * Apple-style Sticky Scroll Section
 * Text stays sticky on left while images scroll on right
 * Follows Apple.com design principles
 */
const StickyScrollSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate which item should be active based on scroll
  useEffect(() => {
    if (prefersReducedMotion) return;

    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const index = Math.min(
        Math.floor(latest * showcaseItems.length),
        showcaseItems.length - 1
      );
      setActiveIndex(index);
    });

    return () => unsubscribe();
  }, [scrollYProgress, prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-apple-light overflow-hidden"
      aria-labelledby="sticky-scroll-heading"
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
            id="sticky-scroll-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tight text-gray-900 mb-6"
            style={{
              fontFeatureSettings: '"kern" 1',
              letterSpacing: "-0.02em",
            }}
          >
            Built for the way you work
          </h2>
          <p className="text-xl sm:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-light">
            Every feature designed to make your gym operations effortless
          </p>
        </motion.div>

        {/* Sticky Scroll Container */}
        <div
          ref={containerRef}
          className="relative min-h-[200vh] lg:min-h-[300vh]"
        >
          {/* Sticky Text Container */}
          <div className="sticky top-24 lg:top-32 h-screen flex items-center">
            <div className="w-full lg:w-1/2 pr-0 lg:pr-12">
              <div className="space-y-12 lg:space-y-16">
                {showcaseItems.map((item, index) => {
                  const isActive = activeIndex === index || prefersReducedMotion;
                  const opacity = isActive ? 1 : 0.3;
                  const scale = isActive ? 1 : 0.95;

                  return (
                    <motion.div
                      key={index}
                      style={{
                        opacity: prefersReducedMotion ? 1 : opacity,
                        scale: prefersReducedMotion ? 1 : scale,
                      }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.5,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="space-y-4"
                    >
                      <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none tracking-tight text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-xl sm:text-2xl text-gray-500 leading-relaxed font-light max-w-lg">
                        {item.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Image Container */}
            <div className="hidden lg:block w-1/2 pl-12">
              <div className="sticky top-24 h-screen flex items-center justify-center">
                <div className="relative w-full max-w-2xl h-[600px]">
                  {showcaseItems.map((item, index) => {
                    const isActive = activeIndex === index || prefersReducedMotion;
                    const baseOpacity = isActive ? 1 : 0;
                    const baseScale = isActive ? 1 : 0.8;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={
                          prefersReducedMotion
                            ? {
                                opacity: baseOpacity,
                                scale: baseScale,
                                y: 0,
                              }
                            : {
                                opacity: baseOpacity,
                                scale: baseScale,
                                y: 0,
                              }
                        }
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.6,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                        className={`w-full rounded-3xl overflow-hidden bg-gradient-to-br ${item.color} p-8 shadow-2xl`}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-auto object-contain rounded-2xl"
                          loading="lazy"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: Stacked Images */}
            <div className="lg:hidden w-full mt-12 space-y-12">
              {showcaseItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={
                    prefersReducedMotion
                      ? {}
                      : {
                          opacity: 1,
                          y: 0,
                        }
                  }
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.6,
                    delay: prefersReducedMotion ? 0 : index * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`w-full rounded-3xl overflow-hidden bg-gradient-to-br ${item.color} p-6 shadow-2xl`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-auto object-contain rounded-2xl"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StickyScrollSection;

