import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiUsers, FiMonitor, FiTrendingUp } from "react-icons/fi";

const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const steps = [
    {
      icon: FiUsers,
      title: "Onboard Your Gym",
      description: "Set up your gym profile, import existing members, and configure your business rules in minutes."
    },
    {
      icon: FiMonitor,
      title: "Run Everything in One Place",
      description: "Manage members, classes, trainers, billing, and analytics from a single, unified dashboard."
    },
    {
      icon: FiTrendingUp,
      title: "Automate and Grow",
      description: "Let AI handle routine tasks while you focus on growing your business and member experience."
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 bg-black text-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight mb-8">
            How It Works
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Three simple steps to transform your gym operations
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400/50 to-purple-400/50 transform -translate-x-1/2 hidden lg:block"></div>
          
          <div className="space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.3 }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left max-w-2xl">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1 }}
          className="text-center mt-24"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center px-12 py-6 bg-white text-black rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 group"
          >
            <span>Get Started Today</span>
            <FiTrendingUp className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks; 