import React from "react";
import { motion } from "framer-motion";
import { FiZap, FiUsers, FiCalendar, FiUserCheck, FiCreditCard, FiGift, FiBarChart2 } from "react-icons/fi";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  stats: string;
  benefits: string[];
  cta: string;
}

interface FeaturesSectionProps {
  isInView: boolean;
  onScrollToSection: (sectionId: string) => void;
}

const features: Feature[] = [
  {
    icon: FiUsers,
    title: "Member Domination",
    description: "Crush churn with Smart-powered retention. Turn every member into a profit center. Predict behavior before it happens.",
    color: "blue",
    stats: "2.3x LTV Increase",
    benefits: ["Automated conquest", "Smart retention", "Predictive domination"],
    cta: "Dominate Members"
  },
  {
    icon: FiCalendar,
    title: "Schedule Mastery",
    description: "Smart system that fills every class. Optimizes capacity. Maximizes revenue. Your schedule becomes a money machine.",
    color: "green",
    stats: "89% Attendance Rate",
    benefits: ["Revenue optimization", "Capacity domination", "Auto-fill magic"],
    cta: "Master Schedule"
  },
  {
    icon: FiUserCheck,
    title: "Trainer Command",
    description: "Turn trainers into profit generators. Track performance. Automate payments. Scale without limits.",
    color: "purple",
    stats: "45% Faster Payments",
    benefits: ["Performance command", "Auto payments", "Scale trainers"],
    cta: "Command Trainers"
  },
  {
    icon: FiCreditCard,
    title: "Financial Domination",
    description: "VAT-compliant invoicing that never fails. Track every penny. Turn expenses into opportunities.",
    color: "orange",
    stats: "100% VAT Compliant",
    benefits: ["Bulletproof invoicing", "Expense mastery", "Real-time control"],
    cta: "Dominate Finance"
  },
  {
    icon: FiGift,
    title: "Marketing Warfare",
    description: "Automated campaigns that convert. Personalized sequences that retain. Marketing that actually works.",
    color: "pink",
    stats: "67% ROI on Campaigns",
    benefits: ["Conversion warfare", "Personalized domination", "Retention mastery"],
    cta: "Launch Campaigns"
  },
  {
    icon: FiBarChart2,
    title: "Intelligence Command",
    description: "Real-time insights that drive decisions. Predictive analytics that spot opportunities. Business intelligence that wins.",
    color: "indigo",
    stats: "Real-time Command",
    benefits: ["Live intelligence", "Predictive power", "Smart domination"],
    cta: "Command Intelligence"
  }
];

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ isInView, onScrollToSection }) => {
  return (
    <section
      id="features"
      className="py-32 px-6 lg:px-20 bg-gray-800 relative overflow-hidden"
    >
      {/* Background decorative elements with MTDRB gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 mtdrb-gradient opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 mtdrb-gradient opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center space-x-3 bg-[#489BFA]/20 text-[#489BFA] px-6 py-3 rounded-full text-sm font-semibold mb-8 border border-[#489BFA]/30">
            <FiZap className="w-4 h-4" />
            <span>Complete Domination</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-white">
            Everything You Need to Dominate
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
            The complete platform that turns gyms into profit machines. Every tool. Every feature. Every advantage.
          </p>
          
          {/* Interactive Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
                          <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-black mtdrb-gradient-text mb-2">6</div>
                <div className="text-sm text-gray-600 font-medium">Core Modules</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-black mtdrb-gradient-text mb-2">24/7</div>
                <div className="text-sm text-gray-600 font-medium">Automation</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="text-3xl font-black mtdrb-gradient-text mb-2">100%</div>
                <div className="text-sm text-gray-600 font-medium">VAT Compliant</div>
              </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ 
                duration: 0.8, 
                delay: 0.2 + index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.02,
                y: -8,
                transition: { duration: 0.3 }
              }}
              className="group relative bg-gray-700 rounded-3xl p-8 border border-gray-600 hover:border-gray-500 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with MTDRB gradient styling */}
              <motion.div
                className="relative w-16 h-16 mtdrb-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"
              >
                <feature.icon className="w-8 h-8 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
              </motion.div>
              
              {/* Content */}
              <div className="relative">
                <h4 className="text-2xl font-bold mb-4 text-white group-hover:text-gray-100 transition-colors duration-300">
                  {feature.title}
                </h4>
                <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                  {feature.description}
                </p>
                
                {/* Benefits list */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Key Benefits
                  </div>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 bg-${feature.color}-400 rounded-full`}></div>
                        <span className="text-xs text-gray-400">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Stats and CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 bg-${feature.color}-400 rounded-full animate-pulse`}></div>
                    <span className="text-sm font-semibold text-gray-400">{feature.stats}</span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-[#489BFA]/20 text-[#489BFA] rounded-full text-xs font-semibold hover:bg-[#489BFA]/30 transition-all duration-300 border border-[#489BFA]/30"
                  >
                    {feature.cta}
                  </motion.button>
                </div>
              </div>
              
              {/* Subtle corner accent with MTDRB gradient */}
              <div className="absolute top-0 right-0 w-16 h-16 mtdrb-gradient opacity-20 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-3xl p-8 border border-gray-600">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Dominate Your Market?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join the gym owners who&apos;ve already started crushing the competition with Idara.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onScrollToSection("pricing")}
                className="px-8 py-4 mtdrb-gradient text-white font-bold rounded-full transition-all duration-300 hover:opacity-90 shadow-lg hover:shadow-xl"
              >
                Start Dominating
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-bold rounded-full transition-all duration-300 hover:border-gray-500 hover:bg-gray-700"
              >
                See the Machine
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection; 