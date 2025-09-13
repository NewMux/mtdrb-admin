import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { 
  FiUsers, 
  FiCreditCard, 
  FiUserCheck, 
  FiBarChart2, 
  FiShield, 
  FiMessageSquare,
  FiTrendingUp,
  FiCalendar,
  FiTarget,
  FiZap,
  FiCheck,
  FiX,
  FiDownload,
  FiEye,
  FiActivity
} from "react-icons/fi";

interface ScrollScene {
  id: string;
  title: string;
  subheadline: string;
  visual: React.ReactNode;
  color: string;
}

const ScrollStorySection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scenes: ScrollScene[] = [
    {
      id: "members",
      title: "Members Page",
      subheadline: "Track every member's journey. From day one to goal achieved.",
      color: "blue",
      visual: <MembersPageVisual />
    },
    {
      id: "billing",
      title: "Billing & VAT",
      subheadline: "Automate invoices, receipts, and tax reporting. Zero errors.",
      color: "green",
      visual: <BillingPageVisual />
    },
    {
      id: "trainers",
      title: "Trainers & Sessions",
      subheadline: "Power your team. Track sessions. Measure trainer output.",
      color: "purple",
      visual: <TrainersPageVisual />
    },
    {
      id: "analytics",
      title: "Analytics Dashboard",
      subheadline: "See everything. Revenue, attendance, churn—in real-time.",
      color: "orange",
      visual: <AnalyticsPageVisual />
    },
    {
      id: "hardware",
      title: "Hardware Integration",
      subheadline: "Control your gym like a fortress. Our hardware is built in.",
      color: "red",
      visual: <HardwarePageVisual />
    },
    {
      id: "ai-bot",
      title: "AI WhatsApp Bot",
      subheadline: "Your 24/7 receptionist. In every member's pocket.",
      color: "teal",
      visual: <WhatsAppBotVisual />
    }
  ];

  // Update active scene based on scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const totalScenes = scenes.length;
      const progressPerScene = 1 / totalScenes;
      const currentScene = Math.floor(latest / progressPerScene);
      const newActiveScene = Math.min(Math.max(currentScene, 0), totalScenes - 1);
      
      setActiveScene(newActiveScene);
    });

    return () => unsubscribe();
  }, [scrollYProgress, scenes.length]);

  return (
    <section ref={containerRef} className="relative bg-black min-h-screen">
      {/* Sticky Headline Container */}
      <div className="sticky top-0 left-0 w-full h-screen flex items-center z-20">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Sticky Headlines */}
            <motion.div 
              className="text-white space-y-8"
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                  Command Your Business.
                  <br />
                  <span className="mtdrb-gradient-text">Dominate Your Market.</span>
                </h2>
                
                {/* Dynamic Subheadline */}
                <motion.div
                  key={activeScene}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl md:text-2xl text-gray-300 leading-relaxed"
                >
                  {scenes[activeScene]?.subheadline}
                </motion.div>
                
                {/* Scene Counter */}
                <div className="text-sm text-gray-500 mt-4">
                  Scene {activeScene + 1} of {scenes.length}
                </div>
              </div>

              {/* Scene Indicators */}
              <div className="flex space-x-2 mt-8">
                {scenes.map((scene, index) => (
                  <motion.button
                    key={scene.id}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === activeScene 
                        ? 'mtdrb-gradient scale-125' 
                        : 'bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => {
                      const element = document.getElementById(scene.id);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right: Visual Container */}
            <div className="relative h-full flex items-center justify-center">
              {scenes.map((scene, index) => (
                <motion.div
                  key={scene.id}
                  id={scene.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={index === activeScene ? { 
                    scale: 1, 
                    opacity: 1, 
                    y: 0 
                  } : { 
                    scale: 0.8, 
                    opacity: 0, 
                    y: 20 
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                >
                  {scene.visual}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Spacer */}
      <div className="relative z-10" style={{ height: `${scenes.length * 100}vh` }}>
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="absolute w-full h-screen flex items-center justify-center"
            style={{ top: `${index * 100}vh` }}
          >
            <div className="text-white/10 text-xs">
              Scroll to see scene {index + 1}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Visual Components
const MembersPageVisual: React.FC = () => (
  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-md">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white">Active Members</h3>
      <div className="text-green-400 text-sm">+12 this week</div>
    </div>
    
    <div className="space-y-4">
      {[
        { name: "Sarah Johnson", status: "active", visits: 15, goal: "Weight Loss" },
        { name: "Mike Chen", status: "active", visits: 8, goal: "Muscle Gain" },
        { name: "Emma Davis", status: "at-risk", visits: 2, goal: "Fitness" },
        { name: "Alex Smith", status: "active", visits: 22, goal: "Endurance" }
      ].map((member, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-medium">{member.name}</div>
              <div className="text-gray-400 text-sm">{member.goal}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">{member.visits} visits</div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              member.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {member.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BillingPageVisual: React.FC = () => (
  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-md">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white">Invoice Generation</h3>
      <div className="text-green-400 text-sm">Auto-generated</div>
    </div>
    
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-medium">Invoice #2024-001</div>
          <div className="text-green-400 text-sm">Paid</div>
        </div>
        <div className="text-gray-400 text-sm mb-2">Sarah Johnson - Premium Membership</div>
        <div className="flex items-center justify-between">
          <div className="text-white font-bold">$89.99</div>
          <div className="text-gray-400 text-xs">VAT: $18.00</div>
        </div>
      </div>
      
      <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
        <div className="flex items-center space-x-2 mb-2">
          <FiCheck className="w-4 h-4 text-green-400" />
          <div className="text-green-400 font-medium">VAT Return Submitted</div>
        </div>
        <div className="text-gray-300 text-sm">Automatically filed with HMRC</div>
      </div>
    </div>
  </div>
);

const TrainersPageVisual: React.FC = () => (
  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-md">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white">Trainer Performance</h3>
      <div className="text-purple-400 text-sm">This Month</div>
    </div>
    
    <div className="space-y-4">
      {[
        { name: "Coach Sarah", sessions: 45, rating: 4.9, clients: 12 },
        { name: "Coach Mike", sessions: 38, rating: 4.8, clients: 10 },
        { name: "Coach Emma", sessions: 52, rating: 4.7, clients: 15 }
      ].map((trainer, index) => (
        <div key={index} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-medium">{trainer.name}</div>
            <div className="text-purple-400 text-sm">{trainer.sessions} sessions</div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-400">Rating: {trainer.rating}⭐</div>
            <div className="text-gray-400">{trainer.clients} clients</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsPageVisual: React.FC = () => (
  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-md">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white">Real-time Analytics</h3>
      <div className="text-orange-400 text-sm">Live</div>
    </div>
    
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">£12,847</div>
          <div className="text-green-400 text-sm">+15% this month</div>
          <div className="text-gray-400 text-xs">Revenue</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">247</div>
          <div className="text-blue-400 text-sm">+8% this week</div>
          <div className="text-gray-400 text-xs">Active Members</div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-medium">Attendance Trend</div>
          <FiTrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div className="h-16 bg-gray-700 rounded flex items-end space-x-1">
          {[60, 75, 80, 85, 90, 88, 92].map((height, index) => (
            <div
              key={index}
              className="bg-green-500 rounded-t"
              style={{ height: `${height}%`, width: '12%' }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HardwarePageVisual: React.FC = () => (
  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-md">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white">Access Control</h3>
      <div className="text-red-400 text-sm">Secure</div>
    </div>
    
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <FiShield className="w-5 h-5 text-red-400" />
          <div className="text-white font-medium">Biometric Logs</div>
        </div>
        <div className="space-y-2">
          {[
            { time: "09:15", user: "Sarah J.", access: "Granted" },
            { time: "09:30", user: "Mike C.", access: "Granted" },
            { time: "10:45", user: "Unknown", access: "Denied" }
          ].map((log, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="text-gray-400">{log.time}</div>
              <div className="text-white">{log.user}</div>
              <div className={`${
                log.access === 'Granted' ? 'text-green-400' : 'text-red-400'
              }`}>
                {log.access}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
        <div className="flex items-center space-x-2">
          <FiActivity className="w-4 h-4 text-red-400" />
          <div className="text-red-400 text-sm">All systems operational</div>
        </div>
      </div>
    </div>
  </div>
);

const WhatsAppBotVisual: React.FC = () => (
  <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-2xl w-full max-w-md">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white">AI Assistant</h3>
      <div className="text-teal-400 text-sm">Online</div>
    </div>
    
    <div className="space-y-4 bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
      <div className="flex justify-end mb-3">
        <div className="bg-teal-500 text-white rounded-lg p-3 max-w-xs">
          <div className="text-sm">Send me my invoice</div>
        </div>
      </div>
      
      <div className="flex justify-start mb-3">
        <div className="bg-gray-700 text-white rounded-lg p-3 max-w-xs">
          <div className="text-sm">📄 Invoice #2024-001</div>
          <div className="text-xs text-gray-400 mt-1">Amount: £89.99</div>
          <div className="text-xs text-teal-400 mt-1">Tap to download</div>
        </div>
      </div>
      
      <div className="flex justify-end mb-3">
        <div className="bg-teal-500 text-white rounded-lg p-3 max-w-xs">
          <div className="text-sm">Book me for tomorrow's yoga class</div>
        </div>
      </div>
      
      <div className="flex justify-start mb-3">
        <div className="bg-gray-700 text-white rounded-lg p-3 max-w-xs">
          <div className="text-sm">✅ Booked for Yoga Class</div>
          <div className="text-xs text-gray-400 mt-1">Tomorrow 7:00 AM</div>
          <div className="text-xs text-teal-400 mt-1">See you there!</div>
        </div>
      </div>
    </div>
  </div>
);

export default ScrollStorySection; 