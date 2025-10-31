"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Search,
  AlertTriangle,
  Wrench,
  Rocket,
  ClipboardList,
} from "lucide-react";

/* =========================================================
  🎨 THEME — Cube colors + borders
  ========================================================= */
const THEME = {
  front: "linear-gradient(180deg, #41995dff, #080c14)",
  top: "linear-gradient(180deg, rgba(71,163,225,1), rgba(100,120,150,0.1))",
  rightDark:
    "linear-gradient(90deg, rgba(80,100,130,0.8), rgba(40,50,65,0.75))",
  leftBright:
    "linear-gradient(-90deg, rgba(100,180,255,0.7), rgba(50,80,120,0.9))",
  leftDark:
    "linear-gradient(-90deg, rgba(80,100,130,0.8), rgba(40,50,65,0.75))",
  rightBright:
    "linear-gradient(90deg, rgba(100,180,255,0.7), rgba(50,80,120,0.9))",
  bottom:
    "linear-gradient(180deg, rgba(87,108,151,0.85), rgba(87,87,253,0.8))",
  back: "linear-gradient(180deg, #101828, #02040a)",
  border: "rgba(150,200,255,0.4)",
};

const FACE_FLIP = false;

/* =========================================================
  🧊 Cube Component
  ========================================================= */
const Cube = ({ icon: Icon, label, variants }) => {
  const cubeDepth = 50;
  const cubeRadius = 5;
  const tilt = { rx: 30, ry: -12, rz: 3 }; // Kept here for face logic

  const rightIsVisibleBySign = tilt.ry > 0;
  const rightIsVisible = FACE_FLIP
    ? !rightIsVisibleBySign
    : rightIsVisibleBySign;

  const rightBg = rightIsVisible ? THEME.rightBright : THEME.rightDark;
  const leftBg = rightIsVisible ? THEME.leftDark : THEME.leftBright;

  const rightFaceStyle = {
    width: `${cubeDepth}px`,
    transform: `rotateY(90deg) translateZ(${cubeDepth / 2}px)`,
    background: rightBg,
    backfaceVisibility: "hidden",
    borderRight: rightIsVisible
      ? "1px solid rgba(88,203,255,0.18)"
      : `1px solid ${THEME.border}`,
    boxShadow: rightIsVisible
      ? "inset -10px 0 28px rgba(88,203,255,0.08), 0 10px 24px rgba(2,6,23,0.6)"
      : "0 6px 18px rgba(2,6,23,0.5)",
    zIndex: 6,
    position: "absolute",
    right: 0,
    borderRadius: `${cubeRadius}px`,
  };

  const leftFaceStyle = {
    width: `${cubeDepth}px`,
    transform: `rotateY(-90deg) translateZ(${cubeDepth / 2}px)`,
    background: leftBg,
    backfaceVisibility: "hidden",
    borderLeft: rightIsVisible
      ? `1px solid ${THEME.border}`
      : "1px solid rgba(88,203,255,0.12)",
    boxShadow: rightIsVisible
      ? "0 6px 18px rgba(2,6,23,0.5)"
      : "inset 10px 0 28px rgba(88,203,255,0.06), 0 6px 18px rgba(2,6,23,0.6)",
    zIndex: 6,
    position: "absolute",
    left: 0,
    borderRadius: `${cubeRadius}px`,
  };

  const visibleRim = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    borderRadius: "inherit",
    mixBlendMode: "screen",
    background: rightIsVisible
      ? "linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0))"
      : "linear-gradient(60deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
    opacity: 1,
    zIndex: 12,
  };

  return (
    <motion.div
      className="relative w-36 h-36 md:w-40 md:h-40 cursor-pointer group"
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        translateY: "-55px",
      }}
      variants={variants}
      // Removed whileHover from here - it's now on the parent
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Shadow below cube */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "86%",
          transform: "translateX(-50%)",
          width: "88%",
          height: 16,
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.36), rgba(0,0,0,0))",
          filter: "blur(10px)",
          zIndex: 0,
        }}
      />

      {/* FRONT */}
      <div
        className="absolute w-full h-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          transform: `translateZ(${cubeDepth / 2}px)`,
          background: THEME.front,
          border: `1px solid ${THEME.border}`,
          borderRadius: `${cubeRadius}px`,
          boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
          zIndex: 10,
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0))",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 border border-blue-400/30">
          <Icon size={30} className="text-blue-300" />
        </div>
        <h3 className="text-sm font-medium text-gray-100 text-center">
          {label}
        </h3>
      </div>

      {/* TOP */}
      <div
        className="absolute w-full"
        style={{
          height: `${cubeDepth}px`,
          transform: `rotateX(-90deg) translateZ(${cubeDepth / 2 - 50}px)`,
          background: THEME.top,
          borderTop: `1px solid ${THEME.border}`,
          borderRadius: `${cubeRadius}px`,
        }}
      />

      {/* RIGHT */}
      <div className="absolute h-full" style={rightFaceStyle}>
        {rightIsVisible && <div style={{ ...visibleRim }} />}
      </div>

      {/* LEFT */}
      <div className="absolute h-full" style={leftFaceStyle}>
        {!rightIsVisible && <div style={{ ...visibleRim }} />}
      </div>

      {/* BOTTOM */}
      <div
        className="absolute w-full"
        style={{
          height: `${cubeDepth}px`,
          transform: `rotateX(90deg) translateZ(-${cubeDepth / 2 + 110}px)`,
          background: THEME.bottom,
          borderBottom: `1px solid ${THEME.border}`,
          borderRadius: `${cubeRadius}px`,
          boxShadow: "inset 0 8px 20px rgba(0,0,0,0.35)",
          zIndex: 2,
        }}
      />

      {/* BACK */}
      <div
        className="absolute w-full h-full"
        style={{
          transform: `rotateY(180deg) translateZ(${cubeDepth / 2}px)`,
          background: THEME.back,
          border: `1px solid ${THEME.border}`,
          borderRadius: `${cubeRadius}px`,
        }}
      />
    </motion.div>
  );
};

/* =========================================================
  ⚙️ Agentic AI Flow (Main Section)
  ========================================================= */
export default function AgenticAIFlow() {
  const tasks = [
    { icon: Search, label: "Scan Repos" },
    { icon: AlertTriangle, label: "Identify Issues" },
    { icon: Wrench, label: "Auto-Fix Code" },
    { icon: Rocket, label: "Deploy Changes" },
    { icon: ClipboardList, label: "Generate Reports" },
  ];

  const tilt = { rx: 30, ry: -12, rz: 3 };
  const flowRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const translateYRaw = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);
  const translateY = useSpring(translateYRaw, { damping: 24, stiffness: 150 });

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

  // UPDATED: Set a reusable stagger amount
  const staggerAmount = 0.5;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      // UPDATED: Increased stagger duration
      transition: { when: "beforeChildren", staggerChildren: staggerAmount },
    },
  };

  // UPDATED: Changed transition for opacity to fix 3D glitch
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50, // Start lower
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        // Spring for y and scale
        type: "spring",
        stiffness: 100,
        damping: 14,
        // Tween for opacity to prevent 3D rendering glitch
        opacity: { duration: 0.4, ease: "easeInOut" },
      },
    },
  };

  return (
    <section
      id="workflow"
      className="relative flex flex-col items-center justify-center min-h-screen py-32 px-6 bg-black text-white overflow-hidden"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 w-3A/4 h-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-r from-purple-900/50 via-indigo-900/60 to-transparent blur-3xl opacity-40"
        />
      </div>

      <h2 className="text-4xl md:text-5xl font-semibold mb-24 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-green-300 to-blue-400 z-10">
        Agentic AI Workflow
      </h2>

      <motion.div
        ref={flowRef}
        className="relative flex items-center justify-center w-full max-w-7xl mx-auto px-4"
        style={{ y: translateY }}
      >
        {/* ================================================================ */}
        {/* 3D Scene Wrapper                                                 */}
        {/* ================================================================ */}
        <motion.div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            // Apply the base tilt here
            rotateX: tilt.rx,
            rotateY: tilt.ry,
            rotateZ: tilt.rz,
          }}
          // Apply the hover animation to the *whole scene*
          whileHover={{
            rotateX: tilt.rx + 5,
            rotateY: tilt.ry - 5,
            translateZ: 15,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* === Dashboard Base Layer (Now inside 3D scene) === */}
          <motion.div
            // UPDATED: Made wider
            className="absolute w-[120%] h-[400px] rounded-3xl"
            style={{
              // UPDATED: Pushed much further back and shifted down slightly
              transform: `
                rotateY(180deg)
                translateZ(-250px)
                translateY(20px)
              `,
              background:
                "linear-gradient(180deg, rgba(20,35,60,0.7), rgba(10,15,30,0.95))",
              border: "1px solid rgba(120,180,255,0.25)",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.45), inset 0 0 50px rgba(88,203,255,0.08)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              zIndex: 0, // Behind the cubes
              // Ensure it covers the area behind the cubes
              left: "50%",
              top: "50%",
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* === Cube Container (Now inside 3D scene) === */}
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-4 rounded-3xl p-8 relative z-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {tasks.map((task, idx) => (
              <React.Fragment key={task.label}>
                <Cube icon={task.icon} label={task.label} variants={itemVariants} />

                {/* Connectors */}
                {idx < tasks.length - 1 && (
                  <>
                    <motion.div
                      className="w-16 h-1 bg-gray-700/50 rounded-full relative overflow-hidden hidden md:block"
                      variants={itemVariants} // Use itemVariants for staggered animation
                    >
                      <motion.div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{
                          width: "25%",
                          background:
                            "linear-gradient(90deg, transparent, rgba(88,203,255,0.9), transparent)",
                          filter: "blur(4px)",
                        }}
                        animate={{ x: ["-120%", "220%"] }}
                        transition={{
                          duration: 1.6,
                          // UPDATED: Delay calc respects stagger
                          delay: (idx * 2 + 1) * staggerAmount + 0.3,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "linear",
                        }}
                      />
                    </motion.div>

                    {/* Mobile vertical line */}
                    <motion.div
                      className="w-1 h-16 bg-gray-700/50 rounded-full relative overflow-hidden md:hidden"
                      variants={itemVariants} // Use itemVariants for staggered animation
                    >
                      <motion.div
                        className="absolute top-0 left-0 w-full h-1/4 rounded-full"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent, rgba(88,203,255,0.9))",
                          filter: "blur(4px)",
                        }}
                        animate={{ y: ["-120%", "240%"] }}
                        transition={{
                          duration: 1.6,
                          // UPDATED: Delay calc respects stagger
                          delay: (idx * 2 + 1) * staggerAmount + 0.3,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "linear",
                        }}
                      />
                    </motion.div>
                  </>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <p className="mt-24 text-gray-400 text-center max-w-2xl text-lg z-10">
        Our intelligent agents autonomously handle every step, from scanning and
        fixing code{" "}
        <span className="text-green-300">to deploying changes</span> and
        generating comprehensive reports.
      </p>
    </section>
  );
}

