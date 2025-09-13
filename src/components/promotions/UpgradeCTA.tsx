import React from "react";
import {
  FiZap,
  FiCpu,
  FiTrendingUp,
  FiAward,
  FiArrowRight,
} from "react-icons/fi";
import { motion } from "framer-motion";

const UpgradeCTA: React.FC = () => {
  const features = [
    {
      icon: <FiCpu className="h-5 w-5" />,
      title: "AI Campaign Suggestions",
      description: "Get personalized campaign recommendations",
    },
    {
      icon: <FiZap className="h-5 w-5" />,
      title: "Smart Automation",
      description: "Automated workflows and triggers",
    },
    {
      icon: <FiTrendingUp className="h-5 w-5" />,
      title: "Advanced Analytics",
      description: "Deep insights and ROI tracking",
    },
    {
      icon: <FiAward className="h-5 w-5" />,
      title: "Premium Templates",
      description: "Access to exclusive campaign templates",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FiZap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Unlock AI Campaigns & Automation
              </h2>
              <p className="text-purple-100 mt-1">
                Take your promotions to the next level with smart features
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-white/10 rounded-2xl backdrop-blur-sm"
              >
                <div className="p-2 bg-white/20 rounded-lg">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-purple-100 text-xs">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 flex items-center space-x-2">
              <span>Upgrade to Pro</span>
              <FiArrowRight className="h-4 w-4" />
            </button>
            <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>

        <div className="hidden lg:block ml-8">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">$4,218</div>
              <div className="text-purple-100 text-sm">
                Average revenue increase
              </div>
              <div className="text-green-300 text-xs mt-1">+340% ROI</div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active campaigns</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Conversion rate</span>
                <span className="font-semibold">24.5%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Members engaged</span>
                <span className="font-semibold">921</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-100">
            💡 Pro users see 3.2x better campaign performance
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-green-300">🔥 Trending</span>
            <span className="text-purple-100">•</span>
            <span className="text-purple-100">Join 2,847+ gyms</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UpgradeCTA;
export { UpgradeCTA };
