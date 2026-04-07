// src/pages/Landing/Sections/HeroSection.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import AnimatedDashboardMockup from "../../../components/animations/AnimatedDashboardMockup";

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(to, duration = 1.5, inView) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return controls.stop;
  }, [inView, to, duration]);
  return value;
}

// ─── Floating particles ───────────────────────────────────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    dur: Math.random() * 12 + 10,
    delay: Math.random() * -20,
    opacity: Math.random() * 0.3 + 0.06,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity }}
          animate={{ y: [0, -28, 0], opacity: [p.opacity, p.opacity * 2.4, p.opacity] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Grid overlay ─────────────────────────────────────────────────────────────
function GridOverlay() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(99,102,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.055) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%, black, transparent)",
      }}
    />
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatItem({ label, value, suffix, inView }) {
  const count = useCounter(value, 1.4, inView);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-[11px] text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── 3-D tilted dashboard wrapper ────────────────────────────────────────────
function DashboardMockup3D() {
  const wrapperRef = useRef(null);

  // Mouse-reactive tilt on top of the base 3D angle
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springCfg = { damping: 26, stiffness: 130 };
  const tiltX = useSpring(rawX, springCfg); // extra rotateX from mouse
  const tiltY = useSpring(rawY, springCfg); // extra rotateY from mouse

  const handleMouseMove = (e) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 → 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(ny * -5);   // negative: move up = tilt back
    rawY.set(nx * 6);    // positive: move right = tilt right
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full"
      style={{ perspective: "1200px", perspectiveOrigin: "50% 40%" }}
    >
      {/* Glow pool below the card */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "-60px",
          left: "5%",
          right: "5%",
          height: "160px",
          background:
            "radial-gradient(ellipse at center, rgba(79,70,229,0.35) 0%, rgba(16,185,129,0.08) 50%, transparent 70%)",
          filter: "blur(32px)",
          borderRadius: "50%",
        }}
      />

      {/* Second softer glow layer */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "-30px",
          left: "15%",
          right: "15%",
          height: "80px",
          background: "radial-gradient(ellipse, rgba(52,211,153,0.15), transparent 70%)",
          filter: "blur(20px)",
          borderRadius: "50%",
        }}
      />

      {/* The mockup card itself */}
      <motion.div
        style={{
          rotateX: useTransform(tiltX, (v) => 22 + v),   // base 22° + mouse delta
          rotateY: useTransform(tiltY, (v) => -12 + v),  // base -12° + mouse delta
          rotateZ: -2,
          transformStyle: "preserve-3d",
          transformOrigin: "center top",
        }}
        initial={{ opacity: 0, y: 40, rotateX: 35, rotateY: -18, rotateZ: -2, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, rotateX: 22, rotateY: -12, rotateZ: -2, scale: 1 }}
        transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(79,70,229,0.12)",
          transformStyle: "preserve-3d",
          transformOrigin: "center top",
        }}
      >
        {/* Aspect ratio container — dashboard fills this */}
        <div style={{ aspectRatio: "16/9", minHeight: 320 }}>
          <AnimatedDashboardMockup />
        </div>

        {/* Top-edge sheen */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(129,140,248,0.2), rgba(255,255,255,0.1), transparent)",
          }}
        />

        {/* Subtle glass sheen overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.015) 100%)",
          }}
        />

        {/* Bottom fade so it bleeds into the page */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #050b12 0%, rgba(5,11,18,0.6) 60%, transparent 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  const sectionRef = useRef(null);
  const statsRef   = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex flex-col items-center overflow-hidden bg-[#050b12] text-white"
      style={{ minHeight: "100vh" }}
    >
      {/* Top shimmer line */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* Ambient blob behind text */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: "900px",
          height: "560px",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(79,70,229,0.18) 0%, rgba(16,185,129,0.04) 50%, transparent 70%)",
          filter: "blur(1px)",
        }}
      />

      <GridOverlay />
      <ParticleField />

      {/* ── Text block (centered, above mockup) ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-12 pt-28 lg:pt-36 pb-10 flex flex-col items-center text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now in production — trusted by 500+ engineering teams
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-bold leading-[1.08] tracking-tight"
          style={{ fontSize: "clamp(36px, 5.5vw, 64px)" }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          The AI that runs your{" "}
          <span className="relative inline-block">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #818cf8 0%, #34d399 55%, #22d3ee 100%)",
              }}
            >
              DevOps pipeline
            </span>
            {/* Animated underline */}
            <motion.span
              aria-hidden
              className="absolute -bottom-1 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #818cf8, #34d399, transparent)",
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-gray-400 max-w-2xl leading-relaxed"
          style={{ fontSize: "clamp(16px, 1.8vw, 20px)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
        >
          Intelligent agents autonomously manage CI/CD pipelines, scan repositories,
          auto-fix issues, and ship changes — fast, auditable, and always-on.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row gap-3 items-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.55, ease: "easeOut" }}
        >
          <a
            href="http://localhost:7000/auth/github"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-gray-950 font-semibold text-sm shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-white/10 active:translate-y-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Connect with GitHub
            <svg
              className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-gray-300 text-sm font-medium transition-all duration-200 hover:text-white hover:border-white/20 hover:bg-white/[0.04]"
          >
            See how it works
            <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          ref={statsRef}
          className="mt-14 flex items-center justify-center gap-8 md:gap-16 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.6 }}
        >
          {[
            { label: "Deployments / day", value: 12400, suffix: "+" },
            { label: "Avg fix time",      value: 94,    suffix: "s" },
            { label: "Uptime SLA",        value: 99,    suffix: ".9%" },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && (
                <div className="w-px h-8 bg-white/[0.07]" aria-hidden />
              )}
              <StatItem {...stat} inView={statsInView} />
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* ── 3-D Dashboard mockup ── */}
      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <DashboardMockup3D />
      </motion.div>

      {/* Bottom gradient that bleeds into next section */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #060d16 0%, transparent 100%)",
        }}
      />

      {/* Scroll cue */}
      <motion.div
        className="relative z-10 mt-8 mb-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        <span className="text-[10px] text-gray-600 uppercase tracking-widest">Scroll to explore</span>
        <div className="w-5 h-8 rounded-full border border-gray-700/60 flex items-start justify-center pt-1.5">
          <motion.div
            className="w-1 h-1.5 rounded-full bg-gray-600"
            animate={{ y: [0, 14, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}