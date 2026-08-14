import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiMonitor, FiMessageCircle, FiShield } from "react-icons/fi";

const WhatIsIdara: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const pillars = [
    {
      icon: FiMonitor,
      title: "Idara SaaS",
      description: "Complete gym management platform with real-time analytics and automation."
    },
    {
      icon: FiMessageCircle,
      title: "WhatsApp Assistant",
      description: "24/7 Assistant that handles member inquiries and bookings automatically."
    },
    {
      icon: FiShield,
      title: "Biometric Access",
      description: "Secure member check-ins with fingerprint and facial recognition technology."
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 bg-black text-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight mb-8">
            Idara is the operating system for gyms — built for the region.
          </h2>
        </motion.div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <pillar.icon className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white">
                {pillar.title}
              </h3>
              
              <p className="text-lg text-gray-300 leading-relaxed max-w-sm mx-auto">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatIsIdara; 