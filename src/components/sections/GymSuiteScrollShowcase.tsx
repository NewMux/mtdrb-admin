import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiChevronDown, FiSearch, FiRefreshCw } from "react-icons/fi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PanelProps {
  title: string;
  subtitle: string;
  index: number;
}

const Panel: React.FC<PanelProps> = ({ title, subtitle, index }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;

    const panel = panelRef.current;
    const text = textRef.current;
    const device = deviceRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: panel,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onEnter: () => {
          gsap.set(text, { opacity: 0, y: 50 });
          gsap.set(device, { opacity: 0, scale: 0.95, y: 30 });
          
          gsap.to(text, { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            delay: 0.3,
            ease: "power2.out"
          });
          
          gsap.to(device, { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 1.2, 
            delay: 0.6,
            ease: "power2.out"
          });
        },
        onLeave: () => {
          gsap.to(text, { opacity: 0, y: -30, duration: 0.5 });
          gsap.to(device, { opacity: 0, scale: 0.95, y: -20, duration: 0.5 });
        },
        onEnterBack: () => {
          gsap.to(text, { opacity: 1, y: 0, duration: 0.8 });
          gsap.to(device, { opacity: 1, scale: 1, y: 0, duration: 0.8 });
        },
        onLeaveBack: () => {
          gsap.to(text, { opacity: 0, y: 50, duration: 0.5 });
          gsap.to(device, { opacity: 0, scale: 0.95, y: 30, duration: 0.5 });
        }
      }
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [index]);

  return (
    <div 
      ref={panelRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen">
          
          {/* Text content - Left side */}
          <div ref={textRef} className="text-white space-y-8">
            {/* Apple-style pill indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-gray-800/60 backdrop-blur-sm rounded-full text-sm font-medium"
            >
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
              {index + 1} of 6
            </motion.div>

            {/* Apple-style large headline */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight"
            >
              {title}
            </motion.h2>

            {/* Apple-style subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg lg:text-xl text-gray-300 font-light leading-relaxed max-w-lg"
            >
              {subtitle}
            </motion.p>

            {/* Apple-style CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="pt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center px-6 py-3 bg-gray-800/60 text-white rounded-full font-medium text-base border border-white/20 hover:bg-gray-700/60 transition-all duration-300 group"
              >
                <span>Learn More</span>
                <FiArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </motion.div>
          </div>

          {/* Apple-style device mockup - Right side */}
          <div ref={deviceRef} className="relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative"
            >
              {/* Device container */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl">
                {/* Window controls (macOS style) */}
                <div className="absolute top-4 left-4 flex space-x-2 z-10">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                {/* Dashboard interface */}
                <div className="p-6 pt-12">
                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Dashboard</h3>
                    <p className="text-sm text-gray-600">Welcome back, here's what's happening with your gym today.</p>
                  </div>
                  
                  {/* Search bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 mr-4">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-100">
                      <FiRefreshCw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-600 text-sm font-medium">$Progress</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">$45,280</div>
                      <div className="text-xs text-gray-600">Total Revenue</div>
                    </div>
                    
                    {/* Members Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-600 text-sm font-medium">Progress</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">1,247</div>
                      <div className="text-xs text-gray-600">Active Members</div>
                    </div>
                    
                    {/* Attendance Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-600 text-sm font-medium">%Progress</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">78%</div>
                      <div className="text-xs text-gray-600">Class Attendance</div>
                    </div>
                    
                    {/* Satisfaction Card */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-600 text-sm font-medium">Progress</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">4.7/5</div>
                      <div className="text-xs text-gray-600">Member Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Apple-style scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/40"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center space-y-2"
        >
          <span className="text-sm font-light">Scroll to explore</span>
          <FiChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </div>
  );
};

const GymSuiteScrollShowcase: React.FC = () => {
  const [currentPanel, setCurrentPanel] = useState(0);

  const panels = [
    {
      title: "Your\ncommand\ncenter.",
      subtitle: "Track revenue, visits, and KPIs in one glance.",
    },
    {
      title: "Total\nmember\ncontrol.",
      subtitle: "Onboard, track, and retain your fitness community.",
    },
    {
      title: "Smart\nclass\nscheduling.",
      subtitle: "Smart-powered calendar, real-time attendance, and filters.",
    },
    {
      title: "Train the\ntrainers.",
      subtitle: "Assign sessions, track KPIs, and review performance.",
    },
    {
      title: "Insights that\ndrive growth.",
      subtitle: "Automated reports, trends, and business forecasting.",
    },
    {
      title: "Automate\nrevenue.",
      subtitle: "Subscriptions, VAT invoices, and real-time tracking.",
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const panelIndex = Math.floor(scrollPosition / windowHeight);
      setCurrentPanel(Math.min(panelIndex, panels.length - 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [panels.length]);

  return (
    <section className="relative bg-black text-white overflow-hidden" aria-label="Complete Gym Management Suite">
      {/* Panels */}
      <div className="relative">
        {panels.map((panel, index) => (
          <Panel
            key={index}
            title={panel.title}
            subtitle={panel.subtitle}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default GymSuiteScrollShowcase; 