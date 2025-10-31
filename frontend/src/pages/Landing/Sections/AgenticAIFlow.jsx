import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  Search,
  AlertTriangle,
  Wrench,
  Rocket,
  ClipboardList,
} from "lucide-react";

/**
 * A reusable 3D Cube component
 */
const Cube = ({ icon: Icon, label, variants }) => {
  const cubeDepth = 50; // The "thickness" of the cube

  return (
    <motion.div
      className="relative w-36 h-36 md:w-40 md:h-40 cursor-pointer"
      style={{
        transformStyle: "preserve-3d",
        transform: "rotateX(-25deg) rotateY(20deg)", // Initial 3D tilt
      }}
      whileHover={{
        rotateX: -15, // Less tilt on X
        rotateY: 25, // More tilt on Y
        translateZ: 25, // Pop forward
        scale: 1.05,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      variants={variants}
    >
      {/* Front Face */}
      <div
        className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm border border-blue-400/20 rounded-xl p-4 md:p-6 shadow-xl overflow-hidden group"
        style={{
          transform: `translateZ(${cubeDepth / 2}px)`,
          backfaceVisibility: "hidden",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          group-hover={{
            opacity: 1,
            boxShadow: "inset 0 0 10px rgba(60, 150, 255, 0.4)",
            borderColor: "rgba(60, 150, 255, 0.8)",
          }}
          transition={{ duration: 0.2 }}
        />
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 mb-2 border border-blue-400/30">
          <Icon size={30} />
        </div>
        <h3 className="text-sm font-medium text-gray-100 text-center">
          {label}
        </h3>
      </div>

      {/* Top Face - Now more visible */}
      <div
        className="absolute w-full bg-gray-800/80 border-x border-t border-white/20 rounded-t-xl"
        style={{
          height: `${cubeDepth}px`,
          transform: `rotateX(90deg) translateZ(${cubeDepth / 2}px)`,
          backfaceVisibility: "hidden",
        }}
      />

      {/* Left Face - Now more visible */}
      <div
        className="absolute h-full bg-gray-800/70 border-y border-l border-white/20 rounded-l-xl"
        style={{
          width: `${cubeDepth}px`,
          transform: `rotateY(-90deg) translateZ(${cubeDepth / 2}px)`,
          backfaceVisibility: "hidden",
        }}
      />
    </motion.div>
  );
};

/**
 * Component for the Agentic AI Workflow
 */
export default function AgenticAIFlow() {
  const tasks = [
    { icon: Search, label: "Scan Repos" },
    { icon: AlertTriangle, label: "Identify Issues" },
    { icon: Wrench, label: "Auto-Fix Code" },
    { icon: Rocket, label: "Deploy Changes" },
    { icon: ClipboardList, label: "Generate Reports" },
  ];

  const flowRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax for floating the whole section
  const translateYRaw = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);
  const springOpts = { damping: 24, stiffness: 150 };
  const translateY = useSpring(translateYRaw, springOpts);

  const handleMouseMove = (e) => {
    const el = flowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mouseX.set(nx - 0.5);
    mouseY.set(ny - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
  };

  return (
    <section
      id="workflow"
      className="relative flex flex-col items-center justify-center min-h-screen py-32 px-6 bg-black text-white overflow-hidden"
      style={{ perspective: "1000px" }} // Add perspective to the main section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Decorative background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 w-3/4 h-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-r from-purple-900/50 via-indigo-900/60 to-transparent blur-3xl opacity-40"
        />
      </div>

      <h2 className="text-4xl md:text-5xl font-semibold mb-24 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-green-300 to-blue-400 z-10">
        Agentic AI Workflow
      </h2>

      {/* Main Container for the cubes and connectors */}
      <motion.div
        ref={flowRef}
        className="relative flex items-center justify-center w-full max-w-7xl mx-auto px-4" // Added max-w and px-4
        style={{
          y: translateY,
        }}
      >
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-4 rounded-3xl p-8" // Adjusted gap
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {tasks.map((task, idx) => {
            return (
              <React.Fragment key={task.label}>
                <Cube
                  icon={task.icon}
                  label={task.label}
                  variants={itemVariants}
                />

                {/* Connector "Track" - DESKTOP */}
                {idx < tasks.length - 1 && (
                  <motion.div
                    className="w-16 h-1 bg-gray-700/50 rounded-full relative overflow-hidden hidden md:block" // Reduced width
                    variants={itemVariants}
                  >
                    <motion.div
                      className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-transparent to-blue-400/80"
                      style={{
                        translateX: "-100%",
                        filter: "blur(4px)",
                      }}
                      animate={{ translateX: ["-100%", "400%"] }}
                      transition={{
                        duration: 1.5,
                        delay: idx * 0.3 + 1,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear",
                      }}
                    />
                  </motion.div>
                )}

                {/* Connector "Track" - MOBILE */}
                {idx < tasks.length - 1 && (
                  <motion.div
                    className="w-1 h-16 bg-gray-700/50 rounded-full relative overflow-hidden md:hidden"
                    style={{
                      transformOrigin: "top",
                    }}
                    variants={itemVariants}
                  >
                    <motion.div
                      className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-transparent to-blue-400/80"
                      style={{
                        translateY: "-100%",
                        filter: "blur(4px)",
                      }}
                      animate={{ translateY: ["-100%", "400%"] }}
                      transition={{
                        duration: 1.5,
                        delay: idx * 0.3 + 1,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "linear",
                      }}
                    />
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </motion.div>
      </motion.div>
      <p className="mt-24 text-gray-400 text-center max-w-2xl text-lg z-10">
        Our intelligent agents autonomously handle every step, from scanning and fixing code{" "}
        <span className="text-green-300">to deploying changes</span> and
        generating comprehensive reports.
      </p>
    </section>
  );
}

