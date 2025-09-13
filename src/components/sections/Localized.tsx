import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiGlobe, FiShield, FiCreditCard } from "react-icons/fi";

const Localized: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const regionalFeatures = [
    {
      icon: FiGlobe,
      title: "Arabic Interface",
      description: "Full Arabic language support with right-to-left layout and regional typography."
    },
    {
      icon: FiCreditCard,
      title: "VAT Compliance",
      description: "Built-in VAT calculation and reporting for all GCC countries with automatic tax filing."
    },
    {
      icon: FiShield,
      title: "Regional Security",
      description: "Compliance with local data protection laws and secure hosting in the region."
    }
  ];

  const countries = [
    { flag: "🇸🇦", name: "Saudi Arabia" },
    { flag: "🇦🇪", name: "UAE" },
    { flag: "🇧🇭", name: "Bahrain" },
    { flag: "🇶🇦", name: "Qatar" },
    { flag: "🇰🇼", name: "Kuwait" },
    { flag: "🇴🇲", name: "Oman" }
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
          <h2 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight mb-8">
            Built for the Region
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Arabic, VAT, Gulf logic. This isn't a global template.
          </p>
        </motion.div>

        {/* Countries */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 mb-16"
        >
          {countries.map((country, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-4xl">{country.flag}</div>
              <span className="text-sm text-gray-300">{country.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {regionalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Regional Screenshots */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Arabic Interface Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">لوحة التحكم</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">٤٥,٢٨٠ ر.س</div>
                      <div className="text-xs text-gray-600">الإيرادات</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="text-2xl font-bold text-gray-900 mb-1">١,٢٤٧</div>
                      <div className="text-xs text-gray-600">الأعضاء</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: VAT Interface Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">VAT Reports</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">VAT Rate</span>
                      <span className="font-semibold text-gray-900">15%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Sales</span>
                      <span className="font-semibold text-gray-900">$45,280</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">VAT Amount</span>
                      <span className="font-semibold text-gray-900">$6,792</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="text-sm text-green-600 font-medium">✓ VAT Report Generated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Localized; 