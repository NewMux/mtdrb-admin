import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiCheck } from "react-icons/fi";

const Pricing: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 80,
      yearlyPrice: 65,
      description: "Perfect for single-location gyms",
      features: [
        "All core features",
        "Single location",
        "+$20 USD/month per extra location",
        "Basic analytics",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Pro",
      monthlyPrice: 130,
      yearlyPrice: 105,
      description: "For growing gym chains",
      features: [
        "Everything in Starter",
        "$10 USD/month per extra location",
        "Unlimited members",
        "Advanced analytics",
        "Priority support",
        "WhatsApp bot"
      ],
      popular: true
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
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight mb-8">
            Simple Pricing
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            Choose the plan that fits your gym&apos;s needs
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${!isYearly ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: isYearly ? 32 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
            <span className={`text-lg ${isYearly ? 'text-white' : 'text-gray-400'}`}>
              Yearly <span className="text-blue-400">(Save 25%)</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30' 
                  : 'bg-gray-900/50 border border-white/10'
              } backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-300 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>

                {isYearly && (
                  <p className="text-sm text-blue-400 mb-4">Billed annually</p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`w-full py-4 rounded-full font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/20'
                }`}
              >
                Get Started
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-24 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h4 className="text-xl font-semibold text-white mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-300">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white mb-2">Is there a setup fee?</h4>
              <p className="text-gray-300">No setup fees. We&apos;ll help you migrate your data and get started at no additional cost.</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white mb-2">What about VAT?</h4>
              <p className="text-gray-300">All prices include VAT. We handle all tax compliance automatically for MENAT businesses.</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white mb-2">Do you offer custom plans?</h4>
              <p className="text-gray-300">For enterprise gyms with special requirements, we offer custom pricing and features.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing; 