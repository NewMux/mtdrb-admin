import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  image: string;
  alt: string;
  index: number;
  isActive: boolean;
}

const Scene: React.FC<SceneProps> = ({ title, subtitle, image, alt, index, isActive }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const text = textRef.current;
    const image = imageRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onEnter: () => {
          gsap.set(text, { opacity: 0, y: 100 });
          gsap.set(image, { opacity: 0, scale: 0.9, y: 50 });
          
          gsap.to(text, { 
            opacity: 1, 
            y: 0, 
            duration: 1.2, 
            delay: 0.3,
            ease: "power2.out"
          });
          
          gsap.to(image, { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 1.5, 
            delay: 0.6,
            ease: "power2.out"
          });
        },
        onLeave: () => {
          gsap.to(text, { opacity: 0, y: -50, duration: 0.6 });
          gsap.to(image, { opacity: 0, scale: 0.95, y: -30, duration: 0.6 });
        },
        onEnterBack: () => {
          gsap.to(text, { opacity: 1, y: 0, duration: 0.8 });
          gsap.to(image, { opacity: 1, scale: 1, y: 0, duration: 0.8 });
        },
        onLeaveBack: () => {
          gsap.to(text, { opacity: 0, y: 100, duration: 0.6 });
          gsap.to(image, { opacity: 0, scale: 0.9, y: 50, duration: 0.6 });
        }
      }
    });

    return () => {
      tl.kill();
    };
  }, [index]);

  return (
    <div 
      ref={sceneRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b0b] via-black to-[#111]"></div>
      
      {/* Subtle animated background elements */}
      <div className="absolute inset-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center min-h-screen">
          
          {/* Text content - left aligned */}
          <div ref={textRef} className="text-white space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full text-sm font-medium border border-white/10"
            >
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
              {index + 1} of 6
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-5xl lg:text-6xl xl:text-7xl font-semibold leading-tight tracking-tight"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg text-neutral-400 max-w-xl leading-relaxed"
            >
              {subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="pt-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-medium border border-white/20 hover:bg-white/15 transition-all duration-300 group"
              >
                <span>Learn More</span>
                <FiArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </motion.div>
          </div>

          {/* Image content - right aligned */}
          <div ref={imageRef} className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="relative"
            >
              {/* Soft glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl scale-110"></div>
              
              {/* Image container with Apple-style design */}
              <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
                {/* Browser-like header */}
                <div className="absolute top-6 right-6 flex space-x-2 z-10">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                {/* Image */}
                <div className="w-full h-full flex items-center justify-center p-6">
                  <img 
                    src={image} 
                    alt={alt} 
                    className="w-full h-auto max-h-[600px] rounded-2xl shadow-lg object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white/40"
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

const IdaraCinematicShowcase: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);

  const scenes = [
    {
      title: "Your command center.",
      subtitle: "Track revenue, visits, and KPIs in one glance.",
      image: "/Dashboard Overview.png",
      alt: "Dashboard Overview - Real-time gym management dashboard"
    },
    {
      title: "Total control, zero friction.",
      subtitle: "From onboarding to retention, all member data in one view.",
      image: "/Members Dashboard tab.png",
      alt: "Members Dashboard - Comprehensive member management interface"
    },
    {
      title: "Schedule like a pro.",
      subtitle: "Calendar, attendance, trainer linking — fully automated.",
      image: "/Classes Page dashboard tab.png", 
      alt: "Classes Dashboard - Smart class scheduling and management"
    },
    {
      title: "Empower your staff.",
      subtitle: "Assign sessions, review performance, communicate instantly.",
      image: "/Trainers page dashboard tab.png",
      alt: "Trainers Dashboard - Complete trainer management system"
    },
    {
      title: "Insights that drive revenue.",
      subtitle: "Automated reports, trends, filters, and growth tracking.",
      image: "/Dashboard Analytics.png",
      alt: "Analytics Dashboard - Comprehensive business intelligence"
    },
    {
      title: "Money made simple.",
      subtitle: "Smart subscriptions, auto VAT, and payment tracking.",
      image: "/Billing page overview tab.png",
      alt: "Billing Overview - Automated financial management"
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
    <section className="relative bg-black text-white overflow-hidden" aria-label="Idara Product Showcase">
      {/* Scenes */}
      <div className="relative">
        {scenes.map((scene, index) => (
          <Scene
            key={index}
            title={scene.title}
            subtitle={scene.subtitle}
            image={scene.image}
            alt={scene.alt}
            index={index}
            isActive={currentScene === index}
          />
        ))}
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 py-32 px-6 lg:px-24 text-center bg-black"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-4xl lg:text-6xl font-semibold mb-8 leading-tight"
          >
            Ready to transform your gym?
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Join hundreds of gyms already using our platform to streamline operations and boost revenue.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center px-10 py-4 bg-white text-black rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <span>Book Your Free Demo</span>
              <FiArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center px-10 py-4 border border-white/20 text-white rounded-full text-lg font-medium hover:border-white/40 hover:bg-white/5 transition-all duration-300"
            >
              View Pricing Plans
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default IdaraCinematicShowcase; 