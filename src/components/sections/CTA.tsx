import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiArrowRight, FiPlay } from "react-icons/fi";

const CTA: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 bg-black text-white"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center space-y-12">
          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1 }}
            className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight"
          >
            Run your gym
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              like a business.
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
          >
            Join hundreds of gyms already using Idara to streamline operations, boost revenue, and deliver exceptional member experiences.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-12 text-center"
          >
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-gray-300">Gyms Trust Idara</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50,000+</div>
              <div className="text-gray-300">Active Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-gray-300">Satisfaction Rate</div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center pt-8"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center px-12 py-6 bg-white text-black rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 group"
            >
              <span>Book Demo</span>
              <FiArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center px-12 py-6 border-2 border-white/20 text-white rounded-full text-xl font-semibold hover:border-white/40 hover:bg-white/5 transition-all duration-300 group"
            >
              <FiPlay className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span>See Platform</span>
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-16"
          >
            <p className="text-gray-400 mb-6">Trusted by leading gyms across the GCC</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-white">Fitness First</div>
              <div className="text-2xl font-bold text-white">Gold's Gym</div>
              <div className="text-2xl font-bold text-white">Planet Fitness</div>
              <div className="text-2xl font-bold text-white">Anytime Fitness</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA; 