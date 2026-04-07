// src/components/animations/AnimatedDashboardMockup.jsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

// ─── Inline SVG icon paths ────────────────────────────────────────────────────
const P = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  git:       "M6 3a3 3 0 110 6 3 3 0 010-6zm12 12a3 3 0 110 6 3 3 0 010-6zM6 21V9m12 6V9m0 0a3 3 0 00-6 0",
  alert:     "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  check:     "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  settings:  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  scan:      "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  report:    "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  bolt:      "M13 10V3L4 14h7v7l9-11h-7z",
  deploy:    "M5 3l14 9-14 9V3z",
};

function SvgIcon({ p, size = 13, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size, flexShrink: 0 }}>
      <path d={p} />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATUS = {
  success: { label: 'Passed',  dot: '#4ade80', text: '#4ade80', bg: 'rgba(74,222,128,.12)',  border: 'rgba(74,222,128,.25)'  },
  running: { label: 'Running', dot: '#60a5fa', text: '#60a5fa', bg: 'rgba(96,165,250,.12)',  border: 'rgba(96,165,250,.25)'  },
  warning: { label: 'Warning', dot: '#fbbf24', text: '#fbbf24', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.25)'  },
  failed:  { label: 'Failed',  dot: '#f87171', text: '#f87171', bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.25)' },
};

const PIPELINES = [
  { name: 'prod-deploy-web',       branch: 'main',       status: 'success', ago: '2m'  },
  { name: 'staging-api-test',      branch: 'feat/auth',  status: 'running', ago: 'now' },
  { name: 'ci-frontend-build',     branch: 'main',       status: 'success', ago: '3h'  },
  { name: 'security-scan-nightly', branch: 'main',       status: 'warning', ago: '6h'  },
];

const ACTIVITY = [
  { path: P.check,  color: '#4ade80', msg: 'PR #487 auto-merged — all checks passed',     time: 'just now' },
  { path: P.scan,   color: '#818cf8', msg: 'Repo scan complete — 0 critical CVEs',         time: '4m ago'   },
  { path: P.deploy, color: '#22d3ee', msg: 'Deployed v2.4.1 to production',                time: '6m ago'   },
  { path: P.alert,  color: '#fbbf24', msg: 'Detected 3 missing test cases in /auth',       time: '14m ago'  },
  { path: P.bolt,   color: '#a78bfa', msg: 'Auto-fix patch generated for CVE-2024-3912',   time: '18m ago'  },
  { path: P.report, color: '#34d399', msg: 'Weekly audit report ready for review',         time: '1h ago'   },
];

const STATS = [
  { label: 'Deploys today', value: 24,   suffix: '',   color: '#818cf8', delta: '+4'  },
  { label: 'Tests passed',  value: 5218, suffix: '',   color: '#34d399', delta: '+91' },
  { label: 'Issues fixed',  value: 11,   suffix: '',   color: '#22d3ee', delta: '+3'  },
  { label: 'Uptime',        value: 99.9, suffix: '%',  color: '#fbbf24', delta: ''    },
];

const DAYS   = ['M','T','W','T','F','S','S'];
const DEPLOY_BARS = [8, 14, 11, 19, 16, 22, 24];

const HEALTH = [
  { label: 'Coverage',  pct: 97, color: '#34d399' },
  { label: 'Build rate',pct: 94, color: '#818cf8' },
  { label: 'Pass rate', pct: 99, color: '#22d3ee' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PulseDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7, flexShrink: 0 }}>
      <motion.span
        animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }}
      />
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
    </span>
  );
}

function Counter({ target, suffix, color }) {
  const [val, setVal] = useState(0);
  const isFloat = target % 1 !== 0;
  useEffect(() => {
    let cur = 0;
    const step = target / 45;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); return; }
      setVal(isFloat ? target : Math.floor(cur));
    }, 28);
    return () => clearInterval(t);
  }, [target]);
  return (
    <span style={{ color, fontWeight: 700, fontSize: 17, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {isFloat ? target.toFixed(1) : val.toLocaleString()}{suffix}
    </span>
  );
}

function Sparkline({ color, pts }) {
  const W = 54, H = 20;
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const step = W / (pts.length - 1);
  const norm = pts.map(p => H - ((p - mn) / (mx - mn + 0.1)) * H);
  const d = norm.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * step},${y}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".65" />
      <circle cx={(pts.length - 1) * step} cy={norm[norm.length - 1]} r="2" fill={color} />
    </svg>
  );
}

function Donut({ pct, color, size = 42 }) {
  const r = 15, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 38 38">
      <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="3.5" />
      <motion.circle
        cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circ} strokeLinecap="round"
        transform="rotate(-90 19 19)"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <text x="19" y="23" textAnchor="middle" fontSize="7.5" fontWeight="700"
        fill={color} fontFamily="system-ui,sans-serif">{pct}%</text>
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PipelineRow({ item, delay }) {
  const s = STATUS[item.status];
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 8px', borderRadius: 7,
        background: 'rgba(255,255,255,.025)',
        border: '1px solid rgba(255,255,255,.05)',
      }}
    >
      {item.status === 'running'
        ? <PulseDot color={s.dot} />
        : <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      }
      <span style={{ flex: 1, color: '#e5e7eb', fontSize: 10.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
      <span style={{ fontSize: 9.5, color: '#374151', flexShrink: 0 }}>{item.branch}</span>
      <span style={{
        fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 99,
        color: s.text, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0,
      }}>
        {s.label}
      </span>
      <span style={{ fontSize: 9.5, color: '#374151', flexShrink: 0 }}>{item.ago}</span>
    </motion.div>
  );
}

function ActivityRow({ item, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: 'easeOut' }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0',
        borderBottom: '1px solid rgba(255,255,255,.03)' }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        background: `${item.color}18`, border: `1px solid ${item.color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SvgIcon p={item.path} size={10} color={item.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10.5, color: '#d1d5db', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.msg}
        </p>
        <p style={{ fontSize: 9.5, color: '#374151', marginTop: 1 }}>{item.time}</p>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
const AnimatedDashboardMockup = () => {
  const containerRef    = useRef(null);
  const targetProgress  = useMotionValue(0);
  const smoothProgress  = useMotionValue(0);

  // Lerp scroll → smooth
  useEffect(() => {
    let raf;
    const tick = () => {
      const cur = smoothProgress.get(), tgt = targetProgress.get();
      smoothProgress.set(cur + (tgt - cur) * 0.08);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const p = 1 - rect.bottom / (window.innerHeight + rect.height);
      targetProgress.set(Math.min(Math.max(p, 0), 1));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const shimmerX       = useTransform(smoothProgress, [0, 1], ['200%', '-200%']);
  const shimmerOpacity = useTransform(smoothProgress, [0, 0.05, 0.9, 1], [0, 1, 1, 0]);

  const sparkBase = [3, 7, 5, 9, 6, 12, 8, 14, 10, 16, 13, 18];

  const NAV = [
    { path: P.dashboard, label: 'Dashboard', active: true  },
    { path: P.git,       label: 'Pipelines', active: false },
    { path: P.scan,      label: 'Scan',      active: false },
    { path: P.alert,     label: 'Issues',    active: false },
    { path: P.report,    label: 'Reports',   active: false },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%', height: '100%', minHeight: 500,
        background: 'linear-gradient(135deg,#09131f 0%,#060c15 60%,#080f1a 100%)',
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.07)',
        fontFamily: "'Inter',system-ui,sans-serif",
        display: 'flex', flexDirection: 'column',
      }}
    >

      {/* ── Window chrome ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,.06)',
        background: 'rgba(255,255,255,.02)', flexShrink: 0,
      }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(239,68,68,.55)' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(234,179,8,.55)'  }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(34,197,94,.55)'  }} />
        <span style={{ marginLeft: 10, fontSize: 10.5, color: '#374151' }}>DevOps Agent — Dashboard</span>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
          padding: '2px 8px', borderRadius: 99,
          background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)',
        }}>
          <PulseDot color="#4ade80" />
          <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{
          width: 136, flexShrink: 0,
          background: 'rgba(255,255,255,.015)',
          borderRight: '1px solid rgba(255,255,255,.05)',
          display: 'flex', flexDirection: 'column',
          padding: '12px 8px', gap: 2,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px', marginBottom: 14 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
              background: 'rgba(79,70,229,.2)', border: '1px solid rgba(129,140,248,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SvgIcon p={P.bolt} size={11} color="#818cf8" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '-.01em' }}>DevOps AI</span>
          </div>

          {NAV.map(({ path, label, active }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 7, cursor: 'default',
              background: active ? 'rgba(129,140,248,.15)' : 'transparent',
              border: active ? '1px solid rgba(129,140,248,.2)' : '1px solid transparent',
              color: active ? '#818cf8' : '#374151',
            }}>
              <SvgIcon p={path} size={12} color="currentColor" />
              <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
          ))}

          {/* Settings at bottom */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', color: '#374151' }}>
              <SvgIcon p={P.settings} size={12} color="currentColor" />
              <span style={{ fontSize: 10.5 }}>Settings</span>
            </div>
          </div>
        </div>

        {/* Main column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 10.5, color: '#374151' }}>Overview / Active Pipelines</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {['Last 24h', 'All repos'].map(t => (
                <div key={t} style={{
                  fontSize: 9, color: '#4b5563', padding: '2px 8px', borderRadius: 5,
                  border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.03)',
                }}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* ── Stat row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.09, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.06)',
                    borderRadius: 9, padding: '10px 11px',
                  }}
                >
                  <div style={{ fontSize: 8.5, color: '#374151', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>
                    {s.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 7 }}>
                    <Counter target={s.value} suffix={s.suffix} color={s.color} />
                    {s.delta && (
                      <span style={{
                        fontSize: 8.5, color: '#4ade80',
                        background: 'rgba(74,222,128,.1)', padding: '1px 5px',
                        borderRadius: 4, border: '1px solid rgba(74,222,128,.2)',
                      }}>
                        {s.delta}
                      </span>
                    )}
                  </div>
                  <Sparkline color={s.color} pts={sparkBase.map((v, j) => v + i * 2 + j % 3)} />
                </motion.div>
              ))}
            </div>

            {/* ── Pipelines + Activity ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

              <div style={{
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 9, padding: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>Pipelines</span>
                  <span style={{ fontSize: 9, color: '#374151' }}>4 active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {PIPELINES.map((p, i) => (
                    <PipelineRow key={p.name} item={p} delay={0.28 + i * 0.09} />
                  ))}
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 9, padding: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>Agent Activity</span>
                  <PulseDot color="#60a5fa" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {ACTIVITY.map((a, i) => (
                    <ActivityRow key={i} item={a} delay={0.3 + i * 0.08} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Health donuts + Deploy bars ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>

              {/* Donuts */}
              <div style={{
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 9, padding: 10,
              }}>
                <span style={{ fontSize: 9.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 10 }}>
                  System Health
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  {HEALTH.map(h => (
                    <div key={h.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Donut pct={h.pct} color={h.color} />
                      <span style={{ fontSize: 8.5, color: '#374151' }}>{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div style={{
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 9, padding: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Deploy Frequency
                  </span>
                  <span style={{ fontSize: 9, color: '#374151' }}>Last 7 days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 54 }}>
                  {DEPLOY_BARS.map((v, i) => {
                    const isToday = i === 6;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <motion.div
                          style={{
                            width: '100%', borderRadius: '3px 3px 0 0',
                            background: isToday
                              ? 'linear-gradient(180deg,#818cf8,#6366f1)'
                              : 'rgba(129,140,248,.22)',
                            border: isToday ? '1px solid rgba(129,140,248,.45)' : 'none',
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${(v / 24) * 46}px` }}
                          transition={{ delay: 0.5 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <span style={{ fontSize: 8, color: isToday ? '#818cf8' : '#374151' }}>
                          {DAYS[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Scroll-synced shimmer */}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(110deg,transparent 30%,rgba(255,255,255,.04) 50%,transparent 70%)',
          backgroundSize: '200% 100%',
          backgroundPositionX: shimmerX,
          opacity: shimmerOpacity,
          maskImage: 'radial-gradient(circle at top right,black 80%,transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at top right,black 80%,transparent 100%)',
        }}
      />
    </div>
  );
};

export default AnimatedDashboardMockup;