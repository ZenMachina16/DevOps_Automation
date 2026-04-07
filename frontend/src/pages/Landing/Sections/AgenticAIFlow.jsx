// src/pages/Landing/Sections/AgenticFlowSection.jsx
import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const tasks = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    label: "Scan Repos",
    desc: "Deep analysis across all branches, commits, and dependencies.",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.2)",
    step: "01",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    label: "Identify Issues",
    desc: "Surface bugs, CVEs, test failures, and policy violations.",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.2)",
    step: "02",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    label: "Auto-Fix Code",
    desc: "Generate patches, open PRs, request reviews automatically.",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.2)",
    step: "03",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
    label: "Deploy Changes",
    desc: "Canary → staging → prod with automated health gates.",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    border: "rgba(192,132,252,0.2)",
    step: "04",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: "Generate Reports",
    desc: "Executive summaries, diffs, and audit logs on every run.",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.08)",
    border: "rgba(129,140,248,0.2)",
    step: "05",
  },
];

// Connecting arrow between steps
function Arrow({ color }) {
  return (
    <div className="hidden lg:flex items-center self-center pb-6">
      <svg width="36" height="16" viewBox="0 0 36 16" fill="none">
        <path d="M0 8 Q18 2 36 8" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <path d="M30 4l6 4-6 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
    </div>
  );
}

// Task card with hover tilt
function TaskCard({ task, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group relative flex flex-col p-6 rounded-2xl border cursor-default select-none"
      style={{
        background: task.bg,
        borderColor: task.border,
        boxShadow: `0 0 0 1px ${task.border}, 0 20px 60px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Step number watermark */}
      <span
        className="absolute top-3 right-4 text-3xl font-black opacity-[0.07] select-none"
        style={{ color: task.color, fontVariantNumeric: "tabular-nums" }}
      >
        {task.step}
      </span>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `0 0 50px 4px ${task.color}22, inset 0 1px 0 ${task.color}30` }}
      />

      {/* Top line accent */}
      <div className="absolute top-0 left-4 right-4 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${task.color}, transparent)` }} />

      {/* Icon */}
      <div
        className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: task.bg, border: `1px solid ${task.border}`, color: task.color }}
      >
        {task.icon}
      </div>

      {/* Label */}
      <h3 className="relative z-10 text-base font-semibold text-white mb-1.5">
        {task.label}
      </h3>

      {/* Description */}
      <p className="relative z-10 text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
        {task.desc}
      </p>

      {/* Bottom mini-bar */}
      <div className="relative z-10 mt-4 h-0.5 rounded-full overflow-hidden bg-white/[0.05]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: task.color }}
          initial={{ scaleX: 0, transformOrigin: "left" }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 + 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

// Central agent brain SVG
function AgentBrain() {
  return (
    <motion.div
      className="relative mx-auto mb-16 w-24 h-24 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-indigo-500/30"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-indigo-400/20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      {/* Core */}
      <div
        className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center border"
        style={{
          background: "rgba(79,70,229,0.15)",
          borderColor: "rgba(129,140,248,0.35)",
          boxShadow: "0 0 40px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-7 h-7 text-indigo-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
        </svg>
      </div>
    </motion.div>
  );
}

export default function AgenticFlowSection() {
  return (
    <section
      id="workflow"
      className="relative py-32 px-6 bg-[#060d16] overflow-hidden"
    >
      {/* Border */}
      <div aria-hidden className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent" />

      {/* Background */}
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.4), transparent 70%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-400 text-xs font-medium mb-5 tracking-wide uppercase">
            Agentic Workflow
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Five steps. Fully autonomous.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)" }}
            >
              Zero manual intervention
            </span>
          </h2>
          <p className="mt-5 text-gray-400 text-lg max-w-xl mx-auto">
            The agent runs continuously — scanning, fixing, deploying, and reporting while your team ships features.
          </p>
        </motion.div>

        {/* Agent brain icon */}
        <AgentBrain />

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tasks.map((task, idx) => (
            <TaskCard key={task.label} task={task} index={idx} />
          ))}
        </div>

        {/* Bottom testimonial quote */}
        <motion.div
          className="mt-20 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="w-8 h-8 mx-auto mb-4 opacity-30">
            <svg viewBox="0 0 32 32" fill="currentColor" className="text-indigo-400">
              <path d="M10 8C6.686 8 4 10.686 4 14v10h10V14H7c0-1.657 1.343-3 3-3V8zm18 0c-3.314 0-6 2.686-6 6v10h10V14h-7c0-1.657 1.343-3 3-3V8z" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed italic">
            "We went from 3 deploys a week to 20 a day — with less stress, not more. The agent catches things our team used to miss entirely."
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
              SR
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">Sofia Reyes</div>
              <div className="text-xs text-gray-500">VP Engineering, Sable Labs</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 