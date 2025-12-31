// src/pages/Landing/Sections/HeroSection.jsx
import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import AnimatedDashboardMockup from "../../../components/animations/AnimatedDashboardMockup";

export default function HeroSection() {
  const containerRef = useRef(null);

  // Mouse motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 🔹 Subtle motion transforms
  const rotYRaw = useTransform(mouseX, [-1, 1], [3, -3]);
  const rotXRaw = useTransform(mouseY, [-1, 1], [3, -3]);
  const translateYRaw = useTransform(mouseY, [-1, 1], [4, -4]);
  const scaleRaw = useTransform(mouseY, [-1, 1], [1.0, 1.02]);

  const springOpts = { damping: 24, stiffness: 150 };
  const rotY = useSpring(rotYRaw, springOpts);
  const rotX = useSpring(rotXRaw, springOpts);
  const translateY = useSpring(translateYRaw, { damping: 26, stiffness: 140 });
  const scale = useSpring(scaleRaw, { damping: 22, stiffness: 160 });

  const handleMouseMove = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mouseX.set((nx - 0.5) * 2);
    mouseY.set((ny - 0.5) * 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      id="hero"
      className="relative flex flex-col bg-black text-white min-h-screen overflow-hidden"
      aria-label="Hero"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#04121a] to-black opacity-95" />
        <div
          aria-hidden
          className="absolute -left-1/4 top-[-8%] w-[60%] h-[110%] rounded-full bg-gradient-to-r from-[#071428] via-[#0c2b3a] to-transparent blur-3xl opacity-60"
          style={{ transform: "rotate(12deg)" }}
        />
      </div>

      {/* Hero text */}
      <div className="relative z-30 max-w-7xl mx-auto w-full px-6 lg:px-24 pt-28 lg:pt-32 pb-6 flex flex-col items-center text-center">
        <motion.h1
          className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-4xl"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          A purpose-built tool for
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
            DevOps automation
          </span>
        </motion.h1>

        <motion.p
          className="mt-4 text-sm md:text-lg text-gray-300 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6 }}
        >
          Intelligent agents manage CI/CD pipelines, repository scans, and deployments — fast,
          auditable, and reliable for engineers and non-technical stakeholders.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6 }}
        >
          <a
            href="http://localhost:7000/auth/github"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-white text-black font-medium shadow-sm hover:shadow-lg transition transform hover:-translate-y-0.5 text-sm md:text-base"
          >
            Start Automating
          </a>

          <a
            href="#features"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition text-sm md:text-base"
          >
            Learn More
          </a>
        </motion.div>
      </div>

      {/* Mockup section */}
      <div
        className="relative z-20 w-full flex justify-end px-4 md:px-8 -mt-12 md:-mt-20 pb-6 pointer-events-none"
        style={{ touchAction: "none" }}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full flex justify-end md:pr-20 lg:pr-40 xl:pr-0"
          style={{ pointerEvents: "auto" }}
        >
          <motion.div
            className="relative w-[96%] sm:w-[94%] md:w-[92%] lg:w-[90%] xl:w-[88%] 2xl:w-[85%] aspect-[16/9] rounded-2xl overflow-visible"
            initial={{
              opacity: 0,
              y: 24,
              rotateX: 15,
              rotateY: 10,
              rotateZ: -4,
              scale: 1.02,
            }}
            animate={{
              opacity: 1,
              y: 200,
              rotateX: 25,
              rotateY: 35,
              rotateZ: -25,
              scale: 1.45,
            }}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ scale: 1.43 }}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "center",
              x: 90,
            }}
          >
            {/* Mockup container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-800/30 bg-gradient-to-b from-[#06121a] to-[#000000] shadow-2xl">
              <div className="w-full h-full pointer-events-auto">
                <AnimatedDashboardMockup />
              </div>

              {/* Fade overlay: top 60% */}
              <div
                aria-hidden
                // className="absolute top-[45%] left-0 w-full h-[40%] bg-gradient-to-t from-black/95 to-transparent pointer-events-none rounded-b-2xl"
                className="absolute top-[35%] left-0 w-full h-[50%] bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none rounded-b-2xl blur-2xl"
              />
            </div>

            {/* Sheen overlay */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 25%, transparent 40%, transparent 100%)",
                mixBlendMode: "overlay",
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20 md:h-28 lg:h-36" />
    </section>
  );
}
