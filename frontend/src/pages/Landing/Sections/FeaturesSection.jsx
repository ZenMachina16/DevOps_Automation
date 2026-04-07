// src/pages/Landing/Sections/FeaturesSection.jsx
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    tag: "Intelligence",
    title: "Scan & Detect",
    description:
      "Deep static analysis across every commit. Surfaces missing tests, stale docs, security CVEs, and performance regressions before they hit production.",
    accent: "from-indigo-500/20 to-indigo-600/0",
    border: "group-hover:border-indigo-500/40",
    glow: "group-hover:shadow-indigo-500/10",
    tagColor: "bg-indigo-950/60 text-indigo-400 border border-indigo-500/20",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    tag: "Automation",
    title: "Auto Deploy",
    description:
      "Zero-touch deployments with intelligent rollback. The agent validates each stage, monitors error rates, and reverts if anything looks off.",
    accent: "from-emerald-500/20 to-emerald-600/0",
    border: "group-hover:border-emerald-500/40",
    glow: "group-hover:shadow-emerald-500/10",
    tagColor: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tag: "Observability",
    title: "Audit Reports",
    description:
      "Executive-ready summaries and granular changelogs generated automatically. Every action is logged with actor, timestamp, and rationale.",
    accent: "from-violet-500/20 to-violet-600/0",
    border: "group-hover:border-violet-500/40",
    glow: "group-hover:shadow-violet-500/10",
    tagColor: "bg-violet-950/60 text-violet-400 border border-violet-500/20",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    tag: "Alerting",
    title: "Smart Alerts",
    description:
      "Context-aware notifications that cut through noise. Get paged only when it matters — with full context on root cause attached.",
    accent: "from-amber-500/20 to-amber-600/0",
    border: "group-hover:border-amber-500/40",
    glow: "group-hover:shadow-amber-500/10",
    tagColor: "bg-amber-950/60 text-amber-400 border border-amber-500/20",
  },
];

// Animated sparkline for each card
function Sparkline({ color }) {
  const points = [8, 14, 9, 18, 12, 22, 15, 11, 19, 16, 24, 18, 22];
  const maxH = 28;
  const w = 80;
  const step = w / (points.length - 1);
  const norm = points.map((p) => maxH - (p / 28) * maxH);
  const path = norm.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${y}`).join(" ");

  return (
    <svg width={w} height={maxH} viewBox={`0 0 ${w} ${maxH}`} fill="none">
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx={(points.length - 1) * step} cy={norm[norm.length - 1]} r="2" fill={color} opacity="0.8" />
    </svg>
  );
}

const sparkColors = ["#818cf8", "#34d399", "#a78bfa", "#fbbf24"];

// Stagger container
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

// Large glowing number tag
function BigNumber({ n, color }) {
  return (
    <span
      className="absolute -top-5 -right-3 text-[80px] font-black leading-none select-none pointer-events-none"
      style={{
        color: "transparent",
        WebkitTextStroke: `1px ${color}22`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      className="relative py-32 px-6 bg-[#060d16] overflow-hidden"
    >
      {/* Section top border shimmer */}
      <div aria-hidden className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Background radial */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(79,70,229,0.07) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-400 text-xs font-medium mb-5 tracking-wide uppercase">
            Capabilities
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Everything your pipeline needs,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8 0%, #34d399 100%)" }}
            >
              handled autonomously
            </span>
          </h2>
          <p className="mt-5 text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            From the moment code lands in your repo to the instant it reaches users — the agent handles every step.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              variants={cardVariant}
              className={`group relative rounded-2xl border border-white/[0.07] bg-[#0a131e] p-7 cursor-default overflow-hidden transition-all duration-300 hover:shadow-2xl ${f.glow} ${f.border}`}
            >
              {/* Gradient top edge */}
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${f.accent} opacity-60`} />

              {/* Background glow on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

              {/* Big number watermark */}
              <BigNumber n={idx + 1} color={sparkColors[idx]} />

              <div className="relative z-10 flex flex-col h-full">
                {/* Top row: icon + tag + sparkline */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {/* Icon circle */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.08] bg-white/[0.03] text-gray-200 group-hover:scale-105 transition-transform duration-300"
                      style={{ boxShadow: `0 0 20px ${sparkColors[idx]}22` }}
                    >
                      {f.icon}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${f.tagColor}`}>
                      {f.tag}
                    </span>
                  </div>
                  <Sparkline color={sparkColors[idx]} />
                </div>

                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white transition-colors">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                  {f.description}
                </p>

                {/* Learn more link */}
                <div className="mt-5 flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300" style={{ color: sparkColors[idx] }}>
                  <span>Explore feature</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA row */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span className="text-gray-500">Ready to automate your pipeline?</span>
          <a
            href="http://localhost:7000/auth/github"
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Get started free
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}