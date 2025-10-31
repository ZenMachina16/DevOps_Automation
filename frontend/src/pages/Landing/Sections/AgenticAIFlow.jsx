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
 🎨 THEME — Updated "Glass" Cube colors
 ========================================================= */
const THEME = {
  front: "linear-gradient(180deg, rgba(20, 25, 35, 0.8), rgba(10, 15, 25, 0.8))",
  top: "linear-gradient(180deg, rgba(80, 100, 130, 0.3), rgba(40, 50, 65, 0.1))",
  rightDark:
    "linear-gradient(90deg, rgba(25, 30, 40, 0.7), rgba(15, 20, 30, 0.75))",
  leftBright:
    "linear-gradient(-90deg, rgba(70, 90, 120, 0.6), rgba(35, 45, 60, 0.8))",
  leftDark:
    "linear-gradient(-90deg, rgba(25, 30, 40, 0.7), rgba(15, 20, 30, 0.75))",
  rightBright:
    "linear-gradient(90deg, rgba(70, 90, 120, 0.6), rgba(35, 45, 60, 0.8))",
  bottom:
    "linear-gradient(180deg, rgba(30, 40, 60, 0.8), rgba(10, 15, 25, 0.9))",
  back: "linear-gradient(180deg, rgba(15, 20, 30, 0.8), rgba(5, 10, 20, 0.9))",
  border: "rgba(200, 220, 255, 0.2)",
};

/* =========================================================
 🧊 Cube Component
 ========================================================= */
const Cube = ({ icon: Icon, label, color }) => {
  const cubeDepth = 50;
  const cubeRadius = 5;

  const rightFaceStyle = {
    width: `${cubeDepth}px`,
    transform: `rotateY(90deg) translateZ(${cubeDepth / 2}px)`,
    background: THEME.rightBright,
    backfaceVisibility: "hidden",
    borderRight: "1px solid rgba(88,203,255,0.15)",
    boxShadow:
      "inset -10px 0 28px rgba(88,203,255,0.08), 0 10px 24px rgba(2,6,23,0.4)",
    zIndex: 6,
    position: "absolute",
    right: 0,
    borderRadius: `${cubeRadius}px`,
  };

  const leftFaceStyle = {
    width: `${cubeDepth}px`,
    transform: `rotateY(-90deg) translateZ(${cubeDepth / 2}px)`,
    background: THEME.leftDark,
    backfaceVisibility: "hidden",
    borderLeft: `1px solid ${THEME.border}`,
    boxShadow: "0 6px 18px rgba(2,6,23,0.4)",
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
    background:
      "linear-gradient(120deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
    opacity: 1,
    zIndex: 12,
  };

  return (
    <motion.div
      className="relative w-36 h-36 md:w-40 md:h-40 cursor-pointer group"
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        translateY: "-45px",
      }}
      whileHover={{
        rotateY: 20,
        rotateX: -5,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Shadow */}
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
            "radial-gradient(closest-side, rgba(0,0,0,0.3), rgba(0,0,0,0))",
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
          boxShadow: "0 6px 18px rgba(2,6,23,0.5)",
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
              "linear-gradient(120deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
          style={{
            backgroundColor: "rgba(30, 40, 60, 0.5)",
            border: `1px solid rgba(100, 150, 255, 0.1)`,
          }}
        >
          <Icon size={30} style={{ color: color ? color.text : "#d1d5db" }} />
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
        <div style={{ ...visibleRim }} />
      </div>

      {/* LEFT */}
      <div className="absolute h-full" style={leftFaceStyle} />

      {/* BOTTOM */}
      <div
        className="absolute w-full"
        style={{
          height: `${cubeDepth}px`,
          transform: `rotateX(90deg) translateZ(-${cubeDepth / 2 + 110}px)`,
          background: THEME.bottom,
          borderBottom: `1px solid ${THEME.border}`,
          borderRadius: `${cubeRadius}px`,
          boxShadow: "inset 0 8px 20px rgba(0,0,0,0.3)",
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
    { icon: Search, label: "Scan Repos", color: { text: "#60a5fa" } },
    { icon: AlertTriangle, label: "Identify Issues", color: { text: "#facc15" } },
    { icon: Wrench, label: "Auto-Fix Code", color: { text: "#4ade80" } },
    { icon: Rocket, label: "Deploy Changes", color: { text: "#c084fc" } },
    { icon: ClipboardList, label: "Generate Reports", color: { text: "#818cf8" } },
  ];

  const tilt = { rx: 55, ry: -5, rz: 0 };
  const flowRef = useRef(null);

  return (
    <section
      id="workflow"
      className="relative flex flex-col items-center justify-center min-h-screen py-32 px-6 bg-gray-950 text-white overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          aria-hidden
          className="absolute bottom-1/2 left-1/2 w-3/4 h-3/4 -translate-x-1/2 translate-y-1/3 rounded-full bg-gradient-to-r from-blue-900/40 via-indigo-900/50 to-transparent blur-3xl opacity-30"
        />
      </div>

      <h2 className="text-4xl md:text-5xl font-semibold mb-24 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-blue-300 z-10">
        Agentic AI Workflow
      </h2>

      <motion.div ref={flowRef} className="relative flex items-center justify-center w-full max-w-4xl mx-auto px-4">
        <motion.div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            rotateX: tilt.rx,
            rotateY: tilt.ry,
            rotateZ: tilt.rz,
          }}
        >
          {/* === Dashboard Base Layer (static) === */}
          <motion.div
            className="absolute w-[100%] h-[600px] rounded-3xl"
            style={{
              transform: `
                rotateX(60deg)
                translateZ(-250px)
                translateY(80px)
              `,
              background:
                "linear-gradient(180deg, rgba(20, 25, 35, 0.6), rgba(10, 15, 25, 0.7))",
              border: "1px solid rgba(150, 180, 255, 0.1)",
              boxShadow:
                "0 15px 40px rgba(0,0,0,0.4), inset 0 0 30px rgba(88,203,255,0.03)",
              zIndex: 0,
              left: "50%",
              top: "50%",
              translateX: "-50%",
              translateY: "-50%",
            }}
          />

          {/* === Cube Container (rotating separately) === */}
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 rounded-3xl p-8 relative z-10"
            style={{ transformStyle: "preserve-3d" }}
            animate={{
              rotateY: [10, 20, 10],
              rotateX: [-15, -10, -15],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            {tasks.map((task, idx) => (
              <React.Fragment key={task.label}>
                <Cube icon={task.icon} label={task.label} color={task.color} />
                {idx < tasks.length - 1 && (
                  <div className="hidden md:block w-8 h-1 bg-gray-900/60 rounded-full" />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <p className="mt-24 text-gray-400 text-center max-w-2xl text-lg z-10">
        Our intelligent agents autonomously handle every step, from scanning and
        fixing code <span className="text-blue-300">to deploying changes</span> and
        generating comprehensive reports.
      </p>
    </section>
  );
}
