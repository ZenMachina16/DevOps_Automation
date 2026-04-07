// src/pages/Landing/Sections/PipelineSection.jsx
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";

const stages = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    label: "Code",
    sublabel: "Commit pushed",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.08)",
    border: "rgba(129,140,248,0.25)",
    glow: "rgba(129,140,248,0.3)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: "Build",
    sublabel: "Compile & bundle",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.25)",
    glow: "rgba(34,211,238,0.3)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    label: "Test",
    sublabel: "5,200+ assertions",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
    glow: "rgba(52,211,153,0.3)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
    label: "Deploy",
    sublabel: "Zero downtime",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    glow: "rgba(167,139,250,0.3)",
  },
];

// Stage node component
function StageNode({ stage, progress, delay }) {
  const scale = useSpring(useTransform(progress, [delay, delay + 0.18], [0.8, 1]), {
    damping: 22, stiffness: 120,
  });
  const opacity = useTransform(progress, [delay, delay + 0.15], [0.3, 1]);
  const glowOpacity = useTransform(progress, [delay, delay + 0.2], [0, 1]);

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div style={{ scale, opacity }} className="relative flex flex-col items-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            opacity: glowOpacity,
            boxShadow: `0 0 40px 8px ${stage.glow}`,
          }}
        />
        {/* Card */}
        <div
          className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-500"
          style={{
            background: stage.bg,
            borderColor: stage.border,
            color: stage.color,
          }}
        >
          {stage.icon}
          <span className="text-xs font-semibold tracking-wide" style={{ color: stage.color }}>
            {stage.label}
          </span>
        </div>
      </motion.div>
      {/* Sublabel */}
      <motion.span
        className="text-xs text-gray-500 tracking-wide"
        style={{ opacity }}
      >
        {stage.sublabel}
      </motion.span>
    </div>
  );
}

// Animated connector line
function Connector({ progress, delay }) {
  const scaleX = useSpring(useTransform(progress, [delay, delay + 0.12], [0, 1]), {
    damping: 20, stiffness: 100,
  });
  const opacity = useTransform(progress, [delay, delay + 0.1], [0, 0.7]);

  return (
    <div className="hidden md:flex items-center self-start mt-[38px]">
      <div className="relative w-14 h-px bg-white/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 right-0 h-full"
          style={{
            scaleX,
            transformOrigin: "left",
            background: "linear-gradient(90deg, #818cf8, #34d399)",
            opacity,
          }}
        />
      </div>
      {/* Arrow head */}
      <motion.div style={{ opacity }}>
        <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
          <path d="M1 1l5 4-5 4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  );
}

export default function PipelineSection() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.75", "center center"],
  });

  // Delays for each stage
  const stageDelays = [0, 0.22, 0.44, 0.66];

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-6 bg-[#050b12] overflow-hidden"
    >
      {/* Thin top border */}
      <div aria-hidden className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Background gradient blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.3), transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          ref={headingRef}
          className="text-center mb-20"
          initial={{ opacity: 0, y: 28 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-400 text-xs font-medium mb-5 tracking-wide uppercase">
            CI/CD Pipeline
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            From commit to production
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)" }}
            >
              in under two minutes
            </span>
          </h2>
          <p className="mt-5 text-gray-400 text-lg max-w-lg mx-auto">
            Every stage is instrumented, validated, and observable. The agent monitors and corrects in real time.
          </p>
        </motion.div>

        {/* Pipeline row */}
        <div className="flex flex-col md:flex-row items-start justify-center gap-0 md:gap-0 px-4">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.label}>
              <StageNode
                stage={stage}
                progress={scrollYProgress}
                delay={stageDelays[idx]}
              />
              {idx < stages.length - 1 && (
                <Connector progress={scrollYProgress} delay={stageDelays[idx] + 0.18} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Metrics row */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.4, duration: 0.55 }}
        >
          {[
            { label: "Build time", value: "38s avg", icon: "⚡" },
            { label: "Test coverage", value: "97.4%", icon: "✓" },
            { label: "Deploy freq.", value: "180/day", icon: "↑" },
            { label: "MTTR", value: "< 4 min", icon: "↺" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center hover:bg-white/[0.05] transition-colors"
            >
              <div className="text-lg mb-1 opacity-60">{m.icon}</div>
              <div className="text-lg font-semibold text-white tabular-nums">{m.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">{m.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}