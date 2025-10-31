import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion"; // Import new hooks
import { Code, Settings, FlaskConical, Rocket } from "lucide-react";

/**
 * A responsive component visualizing a CI/CD pipeline.
 * On mobile, it stacks vertically. On desktop, it displays horizontally.
 * Animations are linked to scroll progress.
 */
function PipelineSection() {
  const stages = [
    { icon: Code, label: "Code" },
    { icon: Settings, label: "Build" },
    { icon: FlaskConical, label: "Test" },
    { icon: Rocket, label: "Deploy" },
  ];

  // Ref to track the section element for scroll-linking
  const scrollRef = useRef(null);

  // useScroll hook to track scroll progress within the target element
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    // Start animation when section's top hits center, end when bottom hits center
    offset: ["start center", "end center"],
  });

  // Define the shadow values for interpolation
  const shadowIdle = "0 0 15px rgba(0, 255, 255, 0.2)";
  const shadowActive = "0 0 25px rgba(0, 255, 255, 0.5)";

  // Create transformed values for each stage
  const stageAnimations = stages.map((_, index) => {
    // Each stage gets a segment of the scroll progress
    const start = index * 0.2; // e.g., 0.0, 0.2, 0.4, 0.6
    const mid = start + 0.1;   // e.g., 0.1, 0.3, 0.5, 0.7
    const end = start + 0.2;     // e.g., 0.2, 0.4, 0.6, 0.8

    return {
      scale: useTransform(scrollYProgress, [start, mid, end], [1, 1.1, 1]),
      shadow: useTransform(
        scrollYProgress,
        [start, mid, end],
        [shadowIdle, shadowActive, shadowIdle]
      ),
    };
  });

  // Create transformed values for each connector
  const connectorAnimations = stages.slice(0, -1).map((_, index) => {
    // Connectors animate *between* stages
    const start = index * 0.2 + 0.15; // e.g., 0.15, 0.35, 0.55
    const end = start + 0.1;          // e.g., 0.25, 0.45, 0.65

    return useTransform(scrollYProgress, [start, end], [0, 1]);
  });

  return (
    // Add the ref to the section
    <section
      ref={scrollRef}
      className="relative flex flex-col items-center justify-center min-h-screen py-24 px-4 bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white overflow-hidden"
    >
      <h2 className="text-4xl md:text-5xl font-semibold mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-400">
        Our Automated CI/CD Pipeline
      </h2>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const { scale, shadow } = stageAnimations[index];

          return (
            <React.Fragment key={stage.label}>
              {/* Pipeline Stage Node - animated via scroll */}
              <motion.div
                className="relative flex flex-col items-center p-4 cursor-pointer"
                whileHover={{ scale: 1.15 }} // Keep hover for extra interaction
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                style={{ scale: scale }} // Apply scroll-linked scale
              >
                <motion.div
                  className="w-24 h-24 rounded-full backdrop-blur-xl bg-white/5 border-2 border-cyan-400/30 flex items-center justify-center text-cyan-300"
                  style={{ boxShadow: shadow }} // Apply scroll-linked shadow
                >
                  <Icon size={40} />
                </motion.div>
                <p className="mt-4 text-lg font-medium text-gray-200">
                  {stage.label}
                </p>
              </motion.div>

              {/* Connector Line (responsive) - animated via scroll */}
              {index < stages.length - 1 && (
                <div
                  className="
                    w-1 h-16 bg-white/10 rounded-full 
                    md:w-24 md:h-1
                    overflow-hidden
                  "
                >
                  {/* Mobile connector (vertical fill) */}
                  <motion.div
                    className="w-full h-full bg-cyan-400 md:hidden"
                    style={{
                      scaleY: connectorAnimations[index],
                      transformOrigin: "top",
                    }}
                  />
                  {/* Desktop connector (horizontal fill) */}
                  <motion.div
                    className="w-full h-full bg-cyan-400 hidden md:block"
                    style={{
                      scaleX: connectorAnimations[index],
                      transformOrigin: "left",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Subtext */}
      <p className="mt-16 text-gray-400 text-center max-w-xl text-lg">
        Each stage is intelligently automated — from code scanning and building
        to testing and deployment.
      </p>
    </section>
  );
}

/**
 * Main App component to render the PipelineSection.
 * Added dummy divs to create scrollable space.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PipelineSection />
    </div>
  );
}

