import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiZap, FiBarChart2, FiMessageCircle, FiShield, FiGlobe } from "react-icons/fi";

const WhyIdara: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const benefits = [
    {
      icon: FiZap,
      title: "Smart Automation",
      description: "AI-powered workflows that handle routine tasks automatically, saving hours every day."
    },
    {
      icon: FiBarChart2,
      title: "Real-Time Reports",
      description: "Live dashboards and analytics that give you instant insights into your gym's performance."
    },
    {
      icon: FiMessageCircle,
      title: "WhatsApp Bot",
      description: "24/7 AI assistant that handles member inquiries, bookings, and support automatically."
    },
    {
      icon: FiShield,
      title: "Biometric Check-ins",
      description: "Secure fingerprint and facial recognition technology for seamless member access."
    },
    {
      icon: FiGlobe,
      title: "Arabic/English",
      description: "Fully localized interface with Arabic language support and regional business logic."
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
            Why Idara Works
          </h2>
        </motion.div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Benefits */}
          <div className="space-y-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-6"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Supporting Animation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-white/10">
              {/* Animated elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
              
              <div className="relative z-10">
                {/* Mock dashboard interface */}
                <div className="bg-white rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Animated metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200"
                    >
                      <div className="text-2xl font-bold text-gray-900">$45,280</div>
                      <div className="text-xs text-gray-600">Revenue</div>
                    </motion.div>
                    
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200"
                    >
                      <div className="text-2xl font-bold text-gray-900">1,247</div>
                      <div className="text-xs text-gray-600">Members</div>
                    </motion.div>
                    
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200"
                    >
                      <div className="text-2xl font-bold text-gray-900">78%</div>
                      <div className="text-xs text-gray-600">Attendance</div>
                    </motion.div>
                    
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                      className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200"
                    >
                      <div className="text-2xl font-bold text-gray-900">4.7/5</div>
                      <div className="text-xs text-gray-600">Satisfaction</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyIdara; 