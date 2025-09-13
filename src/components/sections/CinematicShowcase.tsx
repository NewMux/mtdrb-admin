import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SceneProps {
  title: string;
  subtitle: string;
  index: number;
}

const Scene: React.FC<SceneProps> = ({ title, subtitle, index }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const text = textRef.current;
    const device = deviceRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
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
      ref={sceneRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50"
    >
      {/* Content */}
      <div className="relative z-10 w-full h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          
          {/* Device mockup - Left side (full section) */}
          <div ref={deviceRef} className="relative w-full h-full flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Device container - now fills entire left section */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden w-full h-full max-w-none">
                {/* Window controls */}
                <div className="absolute top-8 left-8 flex space-x-3 z-10">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                
                {/* Dashboard interface */}
                <div className="p-12 pt-20 h-full flex flex-col">
                  {/* Header */}
                  <div className="mb-12">
                    <h3 className="text-4xl font-semibold text-gray-900 mb-4">Dashboard</h3>
                    <p className="text-xl text-gray-600">Welcome back, here's what's happening with your gym today.</p>
                  </div>
                  
                  {/* KPI Cards - now much larger */}
                  <div className="grid grid-cols-2 gap-8 flex-1">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-3xl border border-green-200 flex flex-col justify-center">
                      <div className="text-6xl font-bold text-gray-900 mb-4">$45,280</div>
                      <div className="text-lg text-gray-600">Revenue</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl border border-blue-200 flex flex-col justify-center">
                      <div className="text-6xl font-bold text-gray-900 mb-4">1,247</div>
                      <div className="text-lg text-gray-600">Members</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-3xl border border-purple-200 flex flex-col justify-center">
                      <div className="text-6xl font-bold text-gray-900 mb-4">78%</div>
                      <div className="text-lg text-gray-600">Attendance</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-3xl border border-yellow-200 flex flex-col justify-center">
                      <div className="text-6xl font-bold text-gray-900 mb-4">4.7/5</div>
                      <div className="text-lg text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Text content - Right side */}
          <div ref={textRef} className="text-gray-900 space-y-12 flex flex-col justify-center px-12 lg:px-16">
            {/* Scene indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-gray-200/80 backdrop-blur-sm rounded-full text-base font-medium text-gray-700"
            >
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
              {index + 1} of 6
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight"
            >
              {title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl lg:text-2xl text-gray-600 font-light leading-relaxed max-w-xl"
            >
              {subtitle}
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="pt-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-full font-medium text-lg border border-gray-300 hover:bg-gray-800 transition-all duration-300 group"
              >
                <span>Learn More</span>
                <FiArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Apple-style scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500"
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

const CinematicShowcase: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);

  const scenes = [
    {
      title: "Your\nCommand\nCenter.",
      subtitle: "Track revenue, visits, and KPIs in one glance.",
    },
    {
      title: "Zero\nfriction.\nFull control.",
      subtitle: "Onboard, track, and retain your fitness community.",
    },
    {
      title: "Smart\nscheduling.\nReal-time.",
      subtitle: "AI-powered calendar, real-time attendance, and filters.",
    },
    {
      title: "Empower\nyour staff.",
      subtitle: "Assign sessions, track KPIs, and review performance.",
    },
    {
      title: "Know your\nnumbers.",
      subtitle: "Automated reports, trends, and business forecasting.",
    },
    {
      title: "Revenue, VAT,\nSubscriptions —\nautomated.",
      subtitle: "Subscriptions, VAT invoices, and real-time tracking.",
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const sceneIndex = Math.floor(scrollPosition / windowHeight);
      setCurrentScene(Math.min(sceneIndex, scenes.length - 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scenes.length]);

  return (
    <section className="relative bg-gray-50 text-gray-900 overflow-hidden" aria-label="Idara Product Showcase">
      {/* Scenes */}
      <div className="relative">
        {scenes.map((scene, index) => (
          <Scene
            key={index}
            title={scene.title}
            subtitle={scene.subtitle}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default CinematicShowcase; 