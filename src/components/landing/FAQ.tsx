import React, { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { LANDING_CONTENT } from "../../lib/constants/landingPage";

/**
 * FAQ Section Component
 * Accordion-style FAQ section with enhanced accessibility
 */
const FAQ: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { pricing } = LANDING_CONTENT;
  const { faq } = pricing;

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleQuestion(index);
    }
    // Arrow key navigation
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index < faq.items.length - 1 ? index + 1 : 0;
      setOpenIndex(nextIndex);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : faq.items.length - 1;
      setOpenIndex(prevIndex);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 lg:py-32 bg-white"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
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
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-900 mb-4 sm:mb-6"
          >
            {faq.headline}
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4" role="list">
          {faq.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={
                isInView && !prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1 }
              }
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: prefersReducedMotion ? 0 : index * 0.1,
              }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              role="listitem"
            >
              <button
                onClick={() => toggleQuestion(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-full px-6 sm:px-8 py-4 sm:py-6 flex items-center justify-between text-left focus:outline-none focus:ring-4 focus:ring-mtdrb-500 focus:ring-offset-2 rounded-2xl min-h-[64px]"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-4">
                  {item.question}
                </h3>
                <motion.div
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          rotate: openIndex === index ? 180 : 0,
                        }
                  }
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="flex-shrink-0"
                  style={
                    prefersReducedMotion
                      ? { transform: `rotate(${openIndex === index ? 180 : 0}deg)` }
                      : undefined
                  }
                  aria-hidden="true"
                >
                  <FiChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </motion.div>
              </button>

              <motion.div
                initial={false}
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        height: openIndex === index ? "auto" : 0,
                        opacity: openIndex === index ? 1 : 0,
                      }
                }
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                className="overflow-hidden"
                style={
                  prefersReducedMotion
                    ? {
                        height: openIndex === index ? "auto" : 0,
                        opacity: openIndex === index ? 1 : 0,
                      }
                    : undefined
                }
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                hidden={openIndex !== index}
              >
                <div className="px-6 sm:px-8 pb-4 sm:pb-6">
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

