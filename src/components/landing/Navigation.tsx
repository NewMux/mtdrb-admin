import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface NavigationProps {
  onScrollToSection?: (sectionId: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ onScrollToSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <img 
              src="/mtdrb-logo.svg" 
              alt="MTDRB" 
              className="h-8 w-auto"
            />
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onScrollToSection?.(item.href.slice(1))}
                className={`text-sm font-semibold transition-all duration-200 relative group ${
                  isScrolled ? "text-gray-700 hover:text-gray-900" : "text-white/80 hover:text-white"
                }`}
              >
                {item.label}
                <div className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full`}></div>
              </motion.button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <SmartButton
                variant="ghost"
                size="sm"
                className={`${
                  isScrolled
                    ? "text-gray-700 hover:text-gray-900 border-gray-300"
                    : "text-white/80 hover:text-white border-white/30"
                }`}
              >
                Sign In
              </SmartButton>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <SmartButton
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                Book Demo
              </SmartButton>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors duration-200"
          >
            {isOpen ? (
              <FiX className={`w-6 h-6 ${isScrolled ? "text-gray-700" : "text-white"}`} />
            ) : (
              <FiMenu className={`w-6 h-6 ${isScrolled ? "text-gray-700" : "text-white"}`} />
            )}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isOpen ? 1 : 0,
            height: isOpen ? "auto" : 0,
          }}
          transition={{ duration: 0.3 }}
          className="lg:hidden overflow-hidden"
        >
          <div className="py-6 space-y-4 border-t border-gray-200">
            {navItems.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onScrollToSection?.(item.href.slice(1));
                  setIsOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-gray-900 font-medium py-2 transition-colors duration-200"
              >
                {item.label}
              </motion.button>
            ))}
            <div className="pt-4 space-y-3">
              <SmartButton
                variant="ghost"
                size="sm"
                className="w-full text-gray-700 hover:text-gray-900 border-gray-300"
              >
                Sign In
              </SmartButton>
              <SmartButton
                variant="primary"
                size="sm"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg"
              >
                Book Demo
              </SmartButton>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navigation; 