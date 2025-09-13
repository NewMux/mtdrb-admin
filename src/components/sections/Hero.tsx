import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiArrowRight, FiPlay, FiMenu, FiX } from "react-icons/fi";

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-100px" });
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900"></div>
      
      {/* Subtle animated elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-bold text-xl">MTDRB</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="px-4 py-2 text-white/80 hover:text-white transition-colors">
                Sign In
              </button>
              <button className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden py-4 border-t border-white/10"
            >
              <nav className="flex flex-col space-y-4">
                <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
                <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
                <div className="pt-4 border-t border-white/10">
                  <button className="w-full px-4 py-2 text-white/80 hover:text-white transition-colors text-left">
                    Sign In
                  </button>
                  <button className="w-full mt-2 px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors">
                    Get Started
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="text-center space-y-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full text-sm font-medium border border-white/10"
          >
            <FiPlay className="w-4 h-4 mr-2" />
            <span>GCC Fitness Technology</span>
          </motion.div>

          {/* Main Headline - Reduced size to prevent overlap */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-white"
          >
            Built for Power.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Designed for Growth.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
          >
            The gym operating system for the GCC
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
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
              className="inline-flex items-center px-12 py-6 border-2 border-white/20 text-white rounded-full text-xl font-semibold hover:border-white/40 hover:bg-white/5 transition-all duration-300"
            >
              Explore Platform
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white/40"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center space-y-2"
        >
          <span className="text-sm font-light">Scroll to explore</span>
          <FiArrowRight className="w-5 h-5 rotate-90" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero; 