import React from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiZap, FiTarget, FiCalendar } from "react-icons/fi";

interface HeroSectionProps {
  isInView: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isInView }) => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gray-900">
      {/* Background Elements - MTDRB Gradient Effects */}
      <div className="absolute inset-0">
        {/* Central glow effect with MTDRB gradient */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 mtdrb-gradient opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 mtdrb-gradient opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Subtle geometric patterns with MTDRB gradient */}
        <div className="absolute top-20 left-20 w-64 h-64 border border-[#489BFA]/20 rounded-full animate-spin" style={{ animationDuration: '30s' }}></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-[#155FD9]/20 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Hero Content - Top Half */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex-1 flex flex-col justify-center text-center px-6 max-w-6xl mx-auto pt-20 pb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-blue-500/30"
          >
            <FiZap className="w-4 h-4" />
            <span>World's Most Adopted Gym AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-white"
          >
            Revolutionizing <span className="mtdrb-gradient-text">Gym Management</span> with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            The only operating system that transforms gyms into profit machines. Automate everything. Scale effortlessly. Dominate your market.
          </motion.p>

          {/* Appointment Booking Interface */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Location Input */}
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <FiTarget className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter gym location..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* Date Input */}
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <FiCalendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Select start date..."
                    className="w-full pl-12 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* CTA Button */}
                <button className="px-8 py-4 mtdrb-gradient text-white font-bold rounded-xl hover:opacity-90 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl">
                  <span>Start Dominating</span>
                  <FiArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview - Bottom Half */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, delay: 1 }}
          className="flex-shrink-0 px-6 max-w-6xl mx-auto pb-20"
        >
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-400">Idara Gym Dashboard</div>
            </div>
            
            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel - Gym Performance Overview */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Gym Performance Overview</h3>
                  <p className="text-gray-400 text-sm">Summary</p>
                </div>
                
                {/* Performance Card */}
                <div className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-white">1,247</div>
                    <div className="text-green-400 text-sm">+15% this month</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">75%</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Active Members</p>
                  <p className="text-xs text-gray-500 mt-1">DESIGN BY IDARA</p>
                </div>
              </div>
              
              {/* Right Panel - Class Schedule */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Class Schedule</h3>
                </div>
                
                {/* Day Selector */}
                <div className="flex space-x-2 mb-4">
                  {['Mon 20', 'Tue 21', 'Wed 22', 'Thu 23', 'Fri 24', 'Sat 25', 'Sun 26'].map((day, index) => (
                    <button
                      key={index}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        index === 1 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                
                {/* Class List */}
                <div className="space-y-3">
                  {[
                    { name: 'Morning Yoga', time: '7:00 AM', capacity: '15/20', color: 'blue' },
                    { name: 'HIIT Training', time: '9:00 AM', capacity: '12/15', color: 'green' },
                    { name: 'Strength Training', time: '6:00 PM', capacity: '8/12', color: 'orange' },
                    { name: 'Cardio Blast', time: '7:30 PM', capacity: '18/25', color: 'purple' },
                    { name: 'Pilates', time: '8:30 PM', capacity: '10/15', color: 'pink' }
                  ].map((classItem, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 bg-${classItem.color}-500 rounded-full`}></div>
                        <div>
                          <div className="text-white font-medium">{classItem.name}</div>
                          <div className="text-gray-400 text-sm">{classItem.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{classItem.capacity}</div>
                        <div className="text-gray-400 text-sm">Capacity</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Cue */}
      <motion.div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-gray-400 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection; 