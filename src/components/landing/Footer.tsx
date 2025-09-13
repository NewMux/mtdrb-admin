import React from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiMail, FiPhone, FiMapPin, FiTwitter, FiLinkedin, FiInstagram, FiGithub } from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

const Footer: React.FC = () => {
  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "API", href: "#" },
      { label: "Documentation", href: "#" },
    ],
    company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Status", href: "#" },
      { label: "Security", href: "#" },
    ],
    legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Licenses", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: FiTwitter, href: "#", label: "Twitter" },
    { icon: FiLinkedin, href: "#", label: "LinkedIn" },
    { icon: FiInstagram, href: "#", label: "Instagram" },
    { icon: FiGithub, href: "#", label: "GitHub" },
  ];

  return (
    <footer className="bg-black text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900"></div>
      
      {/* Floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Main footer content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Left side - Company info */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">I</span>
                  </div>
                  <span className="font-bold text-2xl">Idara</span>
                </div>
                <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                  The all-in-one operating system for modern gyms in the GCC. 
                  Control staff, members, billing, and branches—fully bilingual.
                </p>
              </div>

              {/* Contact info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-400">
                  <FiMapPin className="w-5 h-5" />
                  <span>Bahrain</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <FiMail className="w-5 h-5" />
                  <span>hello@idara.com</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <FiPhone className="w-5 h-5" />
                  <span>+973 1234 5678</span>
                </div>
              </div>

              {/* Social links */}
              <div className="flex space-x-4">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 hover:bg-white/20"
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Right side - Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h3 className="text-white font-semibold mb-4 capitalize">
                    {category}
                  </h3>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.label}>
                        <motion.a
                          href={link.href}
                          whileHover={{ x: 2 }}
                          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                        >
                          {link.label}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="border-t border-gray-800 pt-12 pb-8">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold mb-4">Stay updated</h3>
              <p className="text-gray-400 mb-6">
                Get the latest updates on new features and gym management tips.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors duration-200"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:opacity-90 transition-opacity duration-200"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Idara. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 