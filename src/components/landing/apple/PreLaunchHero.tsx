import React, { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { FiMail, FiCheck } from "react-icons/fi";

/**
 * Pre-Launch Hero Section
 * Apple-style reveal page with email waitlist signup
 * Uses Luna design system
 */
const PreLaunchHero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Parallax effect for hero image
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [0, 100]
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [1, 1.1]
  );
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.3]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsLoading(true);
    // TODO: Integrate with waitlist API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full text-center pt-32 pb-24">
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none tracking-tighter text-lunaNavy"
            style={{
              fontFeatureSettings: '"kern" 1',
              letterSpacing: "-0.04em",
            }}
          >
            The Spreadsheet
            <br />
            <span className="text-lunaNavy">Ends Today.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="text-xl sm:text-2xl lg:text-3xl text-lunaNavy/80 max-w-4xl mx-auto leading-tight font-medium"
          >
            The first lethal-grade operating system for GCC fitness brands.
            <br />
            <span className="text-lunaCyan">Biometrics. Smart Technology. VAT compliance. Baked in.</span>
          </motion.p>

          {/* Email Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isInView && !prefersReducedMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 1 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pt-8"
          >
            {isSubmitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-3 px-6 py-4 bg-lunaLight/30 border border-lunaLight rounded-full"
              >
                <FiCheck className="w-5 h-5 text-lunaCyan" />
                <span className="text-lunaNavy font-semibold">
                  Spot secured. You'll be first to know.
                </span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <div className="flex-1 relative">
                  <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-lunaNavy/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-lunaNavy/20 rounded-full text-lunaNavy placeholder:text-lunaNavy/40 focus:outline-none focus:ring-2 focus:ring-lunaCyan focus:border-lunaCyan transition-all duration-200 font-medium"
                    aria-label="Email address for early access"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 py-3.5 bg-lunaMid text-white rounded-full font-semibold hover:bg-lunaMid/90 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-lunaCyan/30 focus:ring-offset-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                  aria-label="Secure your spot"
                >
                  {isLoading ? "Securing..." : "Secure Your Spot"}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Hero Image with Parallax and Glass Overlay */}
      <motion.div
        ref={imageRef}
        style={{
          y: imageY,
          scale: imageScale,
          opacity: imageOpacity,
        }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <img
              src="/mockups/idara-dashboard.png"
              alt="Idara Dashboard Preview"
              className="w-full max-w-6xl h-auto object-contain"
              loading="eager"
              style={{
                filter: "drop-shadow(0 25px 50px -12px rgba(1, 28, 64, 0.15))",
              }}
            />
            {/* Glass Overlay with Preview Label */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <div className="px-6 py-3 bg-white/80 backdrop-blur-md rounded-full border border-lunaNavy/10 shadow-lg">
                <span className="text-sm font-medium text-lunaNavy">Preview</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white z-[1]" />
    </section>
  );
};

export default PreLaunchHero;

