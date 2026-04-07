// src/pages/Dashboard/Overview.jsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";

// ─── Animated number counter ─────────────────────────────────────────────────
function useCount(target, duration = 1000) {
  const [val, setVal] = useState(0);
  const isFloat = typeof target === "string" && target.includes("%");
  const num = parseFloat(target) || 0;

  useEffect(() => {
    if (num === 0) return;
    let start = 0;
    const step = num / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= num) { setVal(num); clearInterval(t); return; }
      setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [num]);

  return isFloat ? `${val}%` : val;
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 32, width = 80 }) {
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  const area = `M ${pts[0]} L ${pts.join(" L ")} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#","")})`}/>
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1].split(",")[0]} cy={pts[pts.length-1].split(",")[1]}
        r="2.5" fill={color} />
    </svg>
  );
}

// ─── Animated arc / donut ─────────────────────────────────────────────────────
function ArcGauge({ value, max = 100, color, size = 96, thickness = 7 }) {
  const r = (size - thickness * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    let cur = 0;
    const target = pct;
    const step = target / 50;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setAnimated(target); clearInterval(t); return; }
      setAnimated(cur);
    }, 16);
    return () => clearInterval(t);
  }, [pct]);

  const offset = circ * (1 - animated);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={thickness}
        strokeDasharray={circ}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
    </svg>
  );
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0 }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────
function PulseDot({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
      <motion.span animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
    </span>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────────
function StatusChip({ level }) {
  const map = {
    "Healthy":        { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.25)"  },
    "Moderate":       { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)"  },
    "Below Standard": { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
    "Critical":       { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"    },
  };
  const s = map[level] ?? map["Moderate"];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {level}
    </span>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ title, value, sub, color, icon, spark, highlight, delay = 0 }) {
  const sparkData = spark ?? [40,55,48,62,58,70,65,80,72,85,78,90];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: highlight
          ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(248,113,113,0.04))"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${highlight ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", inset: "0 0 auto 0", height: 1,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: 0.5,
      }} />

      {/* Icon + title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", color,
          }}>
            {icon}
          </div>
          <span style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 500, letterSpacing: "0.02em" }}>{title}</span>
        </div>
        <Sparkline data={sparkData} color={color} />
      </div>

      {/* Value */}
      <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: 11, color: "#4b5563", marginTop: 5 }}>{sub}</div>
      )}
    </motion.div>
  );
}

// ─── Repo row ─────────────────────────────────────────────────────────────────
function RepoRow({ repo, index }) {
  const score = repo.maturityScore ?? 0;
  const color = score >= 75 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 100px 80px",
        alignItems: "center",
        gap: 16,
        padding: "12px 16px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.2s",
        cursor: "default",
      }}
      whileHover={{ background: "rgba(255,255,255,0.04)" }}
    >
      {/* Name */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb", marginBottom: 2 }}>
          {repo.fullName}
        </div>
        <div style={{ fontSize: 11, color: "#4b5563" }}>
          {repo.language ?? "Unknown"} · Updated recently
        </div>
      </div>

      {/* Score bar */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: "#6b7280" }}>Maturity</span>
          <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{score}%</span>
        </div>
        <AnimBar pct={score} color={color} delay={0.05 * index + 0.3} />
      </div>

      {/* Level chip */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <StatusChip level={repo.maturityLevel ?? "Moderate"} />
      </div>

      {/* Arc mini-gauge */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ position: "relative", width: 40, height: 40 }}>
          <ArcGauge value={score} color={color} size={40} thickness={4} />
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color, fontVariantNumeric: "tabular-nums",
          }}>
            {score}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Distribution ring chart ──────────────────────────────────────────────────
function DistributionRings({ healthy, moderate, below, total }) {
  const segments = [
    { label: "Healthy",        count: healthy,  color: "#4ade80", pct: total ? Math.round((healthy/total)*100) : 0 },
    { label: "Moderate",       count: moderate, color: "#fbbf24", pct: total ? Math.round((moderate/total)*100) : 0 },
    { label: "Below Standard", count: below,    color: "#f87171", pct: total ? Math.round((below/total)*100) : 0   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {segments.map(({ label, count, color, pct }, i) => (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#4b5563" }}>{count} repos</span>
              <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
            </div>
          </div>
          <AnimBar pct={pct} color={color} delay={0.2 + i * 0.1} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Overview ────────────────────────────────────────────────────────────
export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState("");
  const [mode, setMode]       = useState("production");

  useEffect(() => {
    setLoading(true);
    api.get(`/api/dashboard?mode=${mode}`)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, [mode]);

  // ── Loading state ──
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 400, gap: 16 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.08)",
          borderTopColor: "#818cf8" }}
      />
      <span style={{ fontSize: 13, color: "#4b5563" }}>Loading organization overview…</span>
    </div>
  );

  // ── Error state ──
  if (error) return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "20px 24px",
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 12, color: "#f87171", fontSize: 13,
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 18, height: 18, flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      {error}
    </div>
  );

  const {
    totalRepositories = 0,
    averageMaturity = 0,
    repositories = [],
  } = data || {};

  const analyzed     = repositories.filter((r) => r.maturityScore !== null);
  const belowStd     = analyzed.filter((r) => r.maturityScore < 50);
  const healthy      = analyzed.filter((r) => r.maturityScore >= 75);
  const moderate     = analyzed.filter((r) => r.maturityScore >= 50 && r.maturityScore < 75);

  // Fake sparklines per metric
  const sparks = {
    repos:  [12,14,13,15,16,18,17,19,20,21,totalRepositories,totalRepositories],
    mat:    [55,58,60,62,65,68,70,72,74,76,78,averageMaturity],
    below:  [8,7,9,8,7,6,7,5,6,5,4,belowStd.length],
    health: [3,4,3,5,4,5,6,5,7,6,7,healthy.length],
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff", padding: "0 0 60px" }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 36 }}
      >
        <div>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Organization
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} style={{ width: 12, height: 12 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <span style={{ fontSize: 11, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Overview
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>
            Organization Overview
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
            DevOps maturity &amp; CI health across all repositories
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex", padding: 4, gap: 3,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}>
          {[
            { key: "production", label: "Production", color: "#818cf8" },
            { key: "demo",       label: "Demo",       color: "#a78bfa" },
          ].map(({ key, label, color }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  padding: "8px 18px", borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                  background: active ? color : "transparent",
                  color: active ? "#fff" : "#4b5563",
                  boxShadow: active ? `0 0 20px ${color}40` : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Mode badge ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}
        >
          <PulseDot color={mode === "production" ? "#4ade80" : "#a78bfa"} />
          <span style={{ fontSize: 12, color: mode === "production" ? "#4ade80" : "#a78bfa", fontWeight: 500 }}>
            {mode === "production" ? "Live production data" : "Demo mode — sample data"}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ── Metric cards ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <MetricCard
          title="Total Repositories"
          value={totalRepositories}
          sub={`${analyzed.length} analyzed`}
          color="#818cf8"
          delay={0}
          spark={sparks.repos}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 11h18"/>
            </svg>
          }
        />
        <MetricCard
          title={`Avg Maturity · ${mode}`}
          value={`${averageMaturity ?? 0}%`}
          sub="Across all analyzed repos"
          color="#34d399"
          delay={0.08}
          spark={sparks.mat}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          }
        />
        <MetricCard
          title="Below Standard"
          value={belowStd.length}
          sub="Require immediate attention"
          color="#f87171"
          delay={0.16}
          spark={sparks.below}
          highlight={belowStd.length > 0}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          }
        />
        <MetricCard
          title="Healthy Repos"
          value={healthy.length}
          sub={`${Math.round((healthy.length / (totalRepositories||1)) * 100)}% of total`}
          color="#4ade80"
          delay={0.24}
          spark={sparks.health}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
      </div>

      {/* ── Two-column: Attention + Distribution ──────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>

        {/* Attention required */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {belowStd.length > 0 && <PulseDot color="#f87171" />}
              <h2 style={{ fontSize: 14, fontWeight: 700, color: belowStd.length > 0 ? "#f87171" : "#9ca3af", margin: 0, letterSpacing: "-0.01em" }}>
                {belowStd.length > 0 ? "Attention Required" : "All Repos In Good Standing"}
              </h2>
            </div>
            {belowStd.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                background: "rgba(239,68,68,0.12)", color: "#f87171",
                border: "1px solid rgba(239,68,68,0.25)",
              }}>
                {belowStd.length} repo{belowStd.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {belowStd.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "32px 0", color: "#4b5563" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={1.4} style={{ width: 40, height: 40, opacity: 0.6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span style={{ fontSize: 13 }}>No repositories below standard</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {belowStd.map((repo, i) => (
                <RepoRow key={repo.fullName} repo={repo} index={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Distribution + radial summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.5 }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Central gauge */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "22px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
          }}>
            <span style={{ fontSize: 11.5, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontWeight: 500 }}>
              Overall Health
            </span>
            <div style={{ position: "relative", width: 96, height: 96 }}>
              <ArcGauge
                value={averageMaturity ?? 0}
                color={averageMaturity >= 75 ? "#4ade80" : averageMaturity >= 50 ? "#fbbf24" : "#f87171"}
                size={96} thickness={7}
              />
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 22, fontWeight: 800,
                  color: averageMaturity >= 75 ? "#4ade80" : averageMaturity >= 50 ? "#fbbf24" : "#f87171",
                  lineHeight: 1, fontVariantNumeric: "tabular-nums",
                }}>
                  {averageMaturity ?? 0}%
                </span>
                <span style={{ fontSize: 9, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
                  maturity
                </span>
              </div>
            </div>
          </div>

          {/* Distribution bars */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "22px 24px", flex: 1,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", margin: "0 0 18px",
              textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Distribution
            </h2>
            <DistributionRings
              healthy={healthy.length}
              moderate={moderate.length}
              below={belowStd.length}
              total={totalRepositories}
            />
          </div>
        </motion.div>
      </div>

      {/* ── All repositories table ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44, duration: 0.5 }}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "22px 24px",
        }}
      >
        {/* Table header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#e5e7eb", margin: 0, letterSpacing: "-0.01em" }}>
            All Repositories
          </h2>
          <span style={{ fontSize: 11, color: "#4b5563" }}>{analyzed.length} analysed</span>
        </div>

        {/* Column labels */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 120px 100px 80px",
          gap: 16, padding: "6px 16px", marginBottom: 8,
        }}>
          {["Repository", "Maturity Score", "Level", ""].map((h) => (
            <span key={h} style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              {h}
            </span>
          ))}
        </div>

        {repositories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#374151", fontSize: 13 }}>
            No repositories found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {repositories
              .filter((r) => r.maturityScore !== null)
              .sort((a, b) => (a.maturityScore ?? 0) - (b.maturityScore ?? 0))
              .map((repo, i) => (
                <RepoRow key={repo.fullName} repo={repo} index={i} />
              ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}