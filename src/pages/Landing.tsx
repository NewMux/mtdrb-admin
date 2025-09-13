import React from "react";
import Hero from "../components/sections/Hero";
import WhatIsIdara from "../components/sections/WhatIsIdara";
import CinematicShowcase from "../components/sections/CinematicShowcase";
import HowItWorks from "../components/sections/HowItWorks";
import WhyIdara from "../components/sections/WhyIdara";
import Pricing from "../components/sections/Pricing";
import Localized from "../components/sections/Localized";
import CTA from "../components/sections/CTA";
import Footer from "../components/sections/Footer";

const LandingPage: React.FC = () => {
  return (
    <main className="bg-black text-white font-sans">
      <Hero />
      <WhatIsIdara />
      <CinematicShowcase />
      <HowItWorks />
      <WhyIdara />
      <Pricing />
      <Localized />
      <CTA />
      <Footer />
    </main>
  );
};

export default LandingPage;