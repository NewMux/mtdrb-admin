import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Ae2 from '../components/Ae2';
import { 
  FiZap, 
  FiBarChart2, 
  FiUsers, 
  FiShield, 
  FiCreditCard, 
  FiMapPin,
  FiPlay,
  FiCheck,
  FiArrowRight,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink
} from 'react-icons/fi';

// Features data
const features = [
  {
    icon: <FiZap className="w-8 h-8" />,
    title: "Session Logs & Attendance AI",
    description: "Automated attendance tracking with AI-powered insights and member engagement analytics.",
    gradient: "from-blue-500 to-cyan-500",
    keywords: ["AI-powered", "automated", "insights"]
  },
  {
    icon: <FiUsers className="w-8 h-8" />,
    title: "Trainer Performance Tracking",
    description: "Monitor trainer metrics, class ratings, and performance analytics in real-time.",
    gradient: "from-purple-500 to-pink-500",
    keywords: ["real-time", "metrics", "analytics"]
  },
  {
    icon: <FiShield className="w-8 h-8" />,
    title: "Custom Permissions Matrix",
    description: "Granular role-based access control for staff, trainers, and administrators.",
    gradient: "from-green-500 to-emerald-500",
    keywords: ["granular", "role-based", "secure"]
  },
  {
    icon: <FiCreditCard className="w-8 h-8" />,
    title: "VAT-Compliant Billing",
    description: "Automated VAT calculations and tax-ready reports for MENAT region compliance.",
    gradient: "from-orange-500 to-red-500",
    keywords: ["VAT-compliant", "automated", "compliance"]
  },
  {
    icon: <FiBarChart2 className="w-8 h-8" />,
    title: "Biometric & Device Integration",
    description: "Seamless integration with fitness trackers, biometric devices, and wearables.",
    gradient: "from-indigo-500 to-blue-500",
    keywords: ["seamless", "integration", "wearables"]
  },
  {
    icon: <FiMapPin className="w-8 h-8" />,
    title: "Branch-Level Control for Chains",
    description: "Multi-location management with centralized oversight and local autonomy.",
    gradient: "from-teal-500 to-cyan-500",
    keywords: ["multi-location", "centralized", "autonomy"]
  }
];

// Dashboard screens for carousel
const dashboardScreens = [
  {
    title: "KPI Dashboard",
    description: "Real-time performance metrics",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Trainer Management",
    description: "Staff performance tracking",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Member Analytics",
    description: "Engagement insights",
    color: "from-green-500 to-emerald-500"
  }
];

// Testimonials
const testimonials = [
  {
    quote: "MTDRB Fit cut our admin work by 60% — and our team loves using it.",
    author: "Ahmed Al-Rashid",
    role: "Gym Manager",
    location: "Manama",
    rating: 5,
    avatar: "A"
  },
  {
    quote: "The VAT-compliant billing alone saved us hours every month. Game changer!",
    author: "Sarah Johnson",
    role: "Fitness Director",
    location: "Dubai",
    rating: 5,
    avatar: "S"
  },
  {
    quote: "Best investment we've made for our fitness business. ROI was immediate.",
    author: "Mohammed Hassan",
    role: "Gym Owner",
    location: "Riyadh",
    rating: 5,
    avatar: "M"
  }
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.4, 0.1, 0.2, 1] 
    } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.6, 
      ease: [0.4, 0.1, 0.2, 1] 
    } 
  }
};

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2, ease: "easeOut" }
};

const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1, ease: "easeIn" }
};

const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate dashboard screens
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % dashboardScreens.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Ae2 Test Component */}
      <Ae2 />
      
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#002D9C] to-[#7DCCFF] z-50"
        style={{ scaleX: smoothProgress }}
        transformOrigin="0%"
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Background with animated particles */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#002D9C] via-[#0E5EF2] to-[#7DCCFF] opacity-90" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
          
          {/* Light flare effect */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-transparent rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold leading-tight"
            >
              Run Your Gym Like a{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Pro
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
            >
              The{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent font-semibold">
                smartest admin dashboard
              </span>{" "}
              built for fitness businesses in the MENAT region.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <motion.button
                whileHover={buttonHover}
                whileTap={buttonTap}
                className="bg-gradient-to-r from-[#0E5EF2] to-[#7DCCFF] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Request a Demo</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#7DCCFF] to-[#0E5EF2] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
              
              <motion.button
                whileHover={buttonHover}
                whileTap={buttonTap}
                className="text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">View Features</span>
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0E5EF2] to-[#7DCCFF] w-0 group-hover:w-full transition-all duration-300"
                />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Interactive Dashboard Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-16 relative"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-white/70 text-sm">MTDRB Fit Dashboard</div>
              </div>
              
              {/* Carousel Controls */}
              <div className="flex justify-center space-x-2 mb-4">
                {dashboardScreens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreen(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentScreen === index ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              
              {/* Carousel Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${dashboardScreens[currentScreen].color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
                    <FiBarChart2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {dashboardScreens[currentScreen].title}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {dashboardScreens[currentScreen].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is MTDRB Fit Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              >
                What is MTDRB Fit?
              </motion.h2>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-gray-600 leading-relaxed mb-8"
              >
                MTDRB Fit automates gym operations — from class management and billing to AI-powered analytics and trainer oversight.
              </motion.p>

              <motion.div variants={staggerContainer} className="space-y-6">
                <motion.div 
                  variants={fadeInUp} 
                  className="flex items-start space-x-4 group"
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    ⚡
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Automate admin workflows</h3>
                    <p className="text-gray-600">Reduce manual tasks by <span className="text-blue-600 font-medium">90%</span> with intelligent automation</p>
                  </div>
                </motion.div>

                <motion.div 
                  variants={fadeInUp} 
                  className="flex items-start space-x-4 group"
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    📊
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Smart insights & VAT-ready reports</h3>
                    <p className="text-gray-600">Generate <span className="text-purple-600 font-medium">compliant reports</span> automatically</p>
                  </div>
                </motion.div>

                <motion.div 
                  variants={fadeInUp} 
                  className="flex items-start space-x-4 group"
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    👥
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Track members, staff, and trainers in real-time</h3>
                    <p className="text-gray-600">Complete <span className="text-green-600 font-medium">visibility</span> across your entire operation</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl relative">
                {/* Floating tooltips */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Live Data
                </motion.div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-lg relative group">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Dashboard Overview</h3>
                      <div className="text-green-500 text-sm font-medium flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Live
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center group-hover:scale-105 transition-transform">
                        <div className="text-2xl font-bold text-blue-600">247</div>
                        <div className="text-sm text-gray-600">Active Members</div>
                      </div>
                      <div className="text-center group-hover:scale-105 transition-transform">
                        <div className="text-2xl font-bold text-green-600">12</div>
                        <div className="text-sm text-gray-600">Classes Today</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">New member registration</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Class scheduled</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Payment processed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Powerful Features for Modern Gyms
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Everything you need to run your fitness business efficiently and profitably
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <motion.div 
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-wide uppercase">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description.split(' ').map((word, i) => {
                    const isKeyword = feature.keywords.some(keyword => 
                      word.toLowerCase().includes(keyword.toLowerCase())
                    );
                    return (
                      <span key={i} className={isKeyword ? "text-blue-600 font-medium" : ""}>
                        {word}{" "}
                      </span>
                    );
                  })}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              See MTDRB Fit in Action
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
            >
              Watch how easy it is to manage your gym operations with our intuitive dashboard
            </motion.p>

            <motion.div
              variants={scaleIn}
              className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)`,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }} />
              </div>
              
              <div className="aspect-video bg-gray-700 rounded-2xl flex items-center justify-center relative">
                <motion.button
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                  className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold flex items-center space-x-3 hover:bg-gray-100 transition-colors group"
                >
                  <FiPlay className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>See how it works</span>
                </motion.button>
                
                {/* Hover tooltips */}
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Interactive Demo
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Trusted by Leading Gyms
            </motion.h2>
          </motion.div>

          {/* Testimonial Carousel */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-8 shadow-xl max-w-4xl mx-auto relative"
              >
                {/* Highlight background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-4 justify-center">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <FiStar key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-xl leading-relaxed mb-8 text-center italic">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-lg">{testimonials[currentTestimonial].author}</div>
                      <div className="text-gray-600">{testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].location}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Carousel Controls */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentTestimonial === index ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              One Transparent Plan. No Freemium.
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600 mb-12"
            >
              Get everything you need to run your gym efficiently
            </motion.p>

            <motion.div
              variants={scaleIn}
              className="bg-gradient-to-br from-[#002D9C] to-[#7DCCFF] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
            >
              {/* Glassmorphism effect */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold mb-2">$79</div>
                  <div className="text-blue-100 text-lg">per month</div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">✅</div>
                    <div className="font-semibold">Full Feature Access</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">✅</div>
                    <div className="font-semibold">Unlimited Staff & Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">✅</div>
                    <div className="font-semibold">Premium Support</div>
                  </div>
                </div>

                <motion.button
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 hover:border-white/50 relative overflow-hidden group"
                >
                  <span className="relative z-10">Talk to Sales</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.button>
                
                <p className="text-blue-100 text-sm mt-4 opacity-80">
                  No hidden fees • No commitments • Free personalized demo
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#002D9C]/20 to-[#0E5EF2]/20"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-5xl md:text-6xl font-bold text-white mb-6"
            >
              Ready to simplify your gym's admin operations?
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-300 mb-12"
            >
              Join hundreds of gyms already using MTDRB Fit to streamline their operations
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={buttonHover}
                whileTap={buttonTap}
                className="bg-gradient-to-r from-[#0E5EF2] to-[#7DCCFF] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group relative overflow-hidden"
              >
                <span className="relative z-10">Request a Demo</span>
                <FiArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#7DCCFF] to-[#0E5EF2] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
              
              <motion.button
                whileHover={buttonHover}
                whileTap={buttonTap}
                className="text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
              >
                <span>See How MTDRB Fit Works</span>
                <FiExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4">MTDRB Fit</div>
          <p className="text-gray-400 mb-8">The smartest admin dashboard for fitness businesses</p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 