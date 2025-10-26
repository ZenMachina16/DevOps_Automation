import React from "react";
import HeroSection from "./Sections/HeroSection";
import DevOpsPipeline from "./Sections/DevOpsPipeline";
import AgenticAIFlow from "./Sections/AgenticAIFlow";
import FeaturesSection from "./Sections/FeaturesSection";
import FAQSection from "./Sections/FAQSection";
import Footer from "./Sections/Footer";

const LandingPage = () => {
  return (
    <div>
      <HeroSection />
      <DevOpsPipeline />
      <AgenticAIFlow />
      <FeaturesSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
