// src/pages/Dashboard/RepositoryDetails.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";

// ─── SVG Icon ─────────────────────────────────────────────────────────────────
function Icon({ d, size = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size, flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

const I = {
  back:     "M15 19l-7-7 7-7",
  scan:     "M21 12a9 9 0 11-6.219-8.56",
  check:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  x:        "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  bolt:     "M13 10V3L4 14h7v7l9-11h-7z",
  lock:     "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  eyeoff:   "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  sparkle:  "M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5zm14 0l1 3 3 1-3 1-1 3-1-3-3-1 3-1z",
  alert:    "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  terminal: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

// ─── Spinning loader ──────────────────────────────────────────────────────────
function Spinner({ size = 16 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: "2px solid rgba(255,255,255,0.1)",
        borderTopColor: "#818cf8",
      }}
    />
  );
}

// ─── Score arc ────────────────────────────────────────────────────────────────
function ScoreArc({ score }) {
  const size = 120, thickness = 8, r = (size - thickness * 2) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  const label = score >= 80 ? "Healthy" : score >= 50 ? "Moderate" : "Critical";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={thickness} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {score}%
        </span>
        <span style={{ fontSize: 10, color: "#4b5563", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Animated progress bar ────────────────────────────────────────────────────
function Bar({ pct, color, delay = 0 }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <motion.div style={{ height: "100%", borderRadius: 2, background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {accent && (
        <div style={{
          position: "absolute", inset: "0 0 auto 0", height: 1,
          background: `linear-gradient(90deg,transparent,${accent},transparent)`,
          opacity: 0.5,
        }} />
      )}
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
      letterSpacing: "0.08em", margin: "0 0 16px" }}>
      {children}
    </h2>
  );
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────
function ModeToggle({ mode, setMode }) {
  return (
    <div style={{
      display: "flex", padding: 3, gap: 2,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
    }}>
      {[
        { key: "production", label: "Production", color: "#818cf8" },
        { key: "demo",       label: "Demo",       color: "#a78bfa" },
      ].map(({ key, label, color }) => {
        const active = mode === key;
        return (
          <button key={key} onClick={() => setMode(key)} style={{
            padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            border: "none", cursor: "pointer", transition: "all 0.2s",
            background: active ? color : "transparent",
            color: active ? "#fff" : "#4b5563",
            boxShadow: active ? `0 0 16px ${color}40` : "none",
          }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Session status banner ────────────────────────────────────────────────────
function SessionBanner({ session }) {
  if (!session) return null;
  const running = !["COMPLETED", "FAILED"].includes(session.status);
  const color   = session.status === "COMPLETED" ? "#4ade80" : session.status === "FAILED" ? "#f87171" : "#818cf8";
  const label   = session.status === "COMPLETED" ? "Generation complete" :
                  session.status === "FAILED"    ? "Generation failed" :
                  "Agent is generating files…";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 18px", borderRadius: 10,
        background: `${color}12`, border: `1px solid ${color}30`,
        fontSize: 13, color,
      }}
    >
      {running ? <Spinner size={14} /> : (
        <Icon d={session.status === "COMPLETED" ? I.check : I.alert} size={16} color={color} />
      )}
      {label}
      {session.status === "GENERATING" && (
        <span style={{ fontSize: 11, color: "#4b5563", marginLeft: "auto" }}>
          Session {session.sessionId?.slice(0, 8)}…
        </span>
      )}
    </motion.div>
  );
}

// ─── Env var row ──────────────────────────────────────────────────────────────
function EnvRow({ envKey, configured, value, onChange, onSave }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 10,
      background: configured ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)",
      border: `1px solid ${configured ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"}`,
    }}>
      {/* Status icon */}
      <Icon
        d={configured ? I.check : I.x}
        size={16}
        color={configured ? "#4ade80" : "#f87171"}
      />

      {/* Key name */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7, flex: 1,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}>
        <Icon d={I.lock} size={12} color="#374151" />
        <span style={{ fontSize: 12.5, color: configured ? "#e5e7eb" : "#9ca3af", fontWeight: 500 }}>
          {envKey}
        </span>
        {configured && (
          <span style={{ fontSize: 10, color: "#4b5563", marginLeft: 4 }}>configured</span>
        )}
      </div>

      {/* Input (only if not configured) */}
      {!configured && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              placeholder="Enter value…"
              value={value || ""}
              onChange={e => onChange(e.target.value)}
              style={{
                padding: "6px 34px 6px 10px", borderRadius: 7, fontSize: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e5e7eb", outline: "none", width: 180,
                transition: "border-color 0.15s",
                fontFamily: "inherit",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(129,140,248,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <button
              onClick={() => setShow(s => !s)}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#374151", padding: 0,
              }}
            >
              <Icon d={show ? I.eyeoff : I.eye} size={13} />
            </button>
          </div>
          <button
            onClick={onSave}
            disabled={!value}
            style={{
              padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              background: value ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${value ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.07)"}`,
              color: value ? "#818cf8" : "#374151",
              cursor: value ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Maturity breakdown ───────────────────────────────────────────────────────
function MaturityBreakdown({ maturity }) {
  if (!maturity) return null;
  const cats = Object.entries(maturity)
    .filter(([k]) => k !== "totalScore" && k !== "level")
    .map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
      score: typeof v === "number" ? v : v?.score ?? 0,
    }));

  if (!cats.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {cats.map(({ label, score }, i) => {
        const color = score >= 80 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
        return (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{score}%</span>
            </div>
            <Bar pct={score} color={color} delay={i * 0.08} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RepositoryDetails() {
  const { owner, repoName } = useParams();
  const navigate = useNavigate();
  const repoFullName = `${owner}/${repoName}`;

  const [loading, setLoading]           = useState(true);
  const [repoData, setRepoData]         = useState(null);
  const [error, setError]               = useState("");
  const [scanning, setScanning]         = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [mode, setMode]                 = useState("production");
  const [secrets, setSecrets]           = useState([]);
  const [secretInputs, setSecretInputs] = useState({});

  const loadRepo = async () => {
    try {
      const res       = await api.get(`/api/repo/${owner}/${repoName}`);
      const secretRes = await api.get(`/api/repo/${owner}/${repoName}/secrets`);
      setRepoData(res.data);
      setActiveSession(res.data.activeSession || null);
      setSecrets(secretRes.data || []);
    } catch {
      setError("Failed to load repository details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRepo(); }, [owner, repoName]);

  // Poll active session
  useEffect(() => {
    if (!activeSession || ["COMPLETED", "FAILED"].includes(activeSession.status)) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/session/${activeSession.sessionId}`);
        setActiveSession(res.data);
        if (["COMPLETED", "FAILED"].includes(res.data.status)) {
          clearInterval(interval);
          setTimeout(loadRepo, 2000);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const scanData   = mode === "production" ? repoData?.lastScanProduction : repoData?.lastScanDemo;
  const maturity   = scanData?.maturity;
  const totalScore = maturity?.totalScore || 0;
  const requiredVars   = scanData?.raw?.envVars || [];
  const configuredKeys = useMemo(() => secrets.map(s => s.key), [secrets]);
  const missingVars    = requiredVars.filter(v => !configuredKeys.includes(v));
  const allConfigured  = requiredVars.length > 0 && missingVars.length === 0;

  const handleScan = async () => {
    setScanning(true);
    try {
      let branch = "main";
      if (mode === "demo") {
        if (!repoData?.demoBranch) { alert("No demo branch available."); return; }
        branch = repoData.demoBranch;
      }
      await api.post("/api/scan", { repoFullName, branch, mode });
      await loadRepo();
    } catch { alert("Scan failed"); }
    finally { setScanning(false); }
  };

  const handleSaveSecret = async (key) => {
    const value = secretInputs[key];
    if (!value) return;
    await api.post("/api/secrets/save", { repoFullName, key, value });
    setSecretInputs(p => ({ ...p, [key]: "" }));
    await loadRepo();
  };

  const handleGenerate = async () => {
    if (!allConfigured) { alert("Configure all required environment variables first."); return; }
    setGenerating(true);
    try {
      await api.post("/api/secrets/sync", { repoFullName });
      const res = await api.post("/api/generate-files", { repoFullName });
      if (res.data.success) {
        setActiveSession({ sessionId: res.data.sessionId, status: "GENERATING" });
      } else {
        alert(res.data.error || "Generation failed");
      }
    } catch { alert("Generation failed"); }
    finally { setGenerating(false); }
  };

  // ── States ──
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4b5563", fontSize: 13, padding: "40px 0" }}>
      <Spinner /> Loading repository…
    </div>
  );

  if (error) return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 10, color: "#f87171", fontSize: 13,
    }}>
      <Icon d={I.alert} size={16} color="#f87171" />
      {error}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff", paddingBottom: 60 }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/dashboard/repositories")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "#374151", fontSize: 12, marginBottom: 12, padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#9ca3af"}
          onMouseLeave={e => e.currentTarget.style.color = "#374151"}
        >
          <Icon d={I.back} size={13} />
          Repositories
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>
              <span style={{ color: "#4b5563", fontWeight: 400 }}>{owner}/</span>
              {repoName}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 5 }}>
              DevOps Intelligence &amp; Automation Control
            </p>
          </div>
          <ModeToggle mode={mode} setMode={setMode} />
        </div>
      </motion.div>

      {/* ── Session banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeSession && (
          <div style={{ marginBottom: 16 }}>
            <SessionBanner session={activeSession} />
          </div>
        )}
      </AnimatePresence>

      {/* ── Summary + scan ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        style={{ marginBottom: 14 }}
      >
        <Card accent="#818cf8">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>

            {/* Score arc */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <ScoreArc score={totalScore} />
              <div>
                <div style={{ fontSize: 11, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  DevOps Maturity Score
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, maxWidth: 260 }}>
                  {totalScore >= 80
                    ? "Repository is in excellent shape. Keep up the great work."
                    : totalScore >= 50
                    ? "Some areas need attention. Run a scan for recommendations."
                    : "Significant improvements needed. Start with a full scan."}
                </div>
                {scanData && (
                  <div style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>
                    Last scanned {repoData?.lastScanProduction?.scannedAt
                      ? new Date(repoData.lastScanProduction.scannedAt).toLocaleString()
                      : "—"}
                  </div>
                )}
              </div>
            </div>

            {/* Scan button */}
            <button
              onClick={handleScan}
              disabled={scanning}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: scanning ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: scanning ? "#4b5563" : "#e5e7eb",
                cursor: scanning ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (!scanning) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#e5e7eb"; }}
            >
              {scanning ? <Spinner size={14} /> : <Icon d={I.scan} size={15} />}
              {scanning ? "Scanning…" : `Run ${mode === "production" ? "Production" : "Demo"} Scan`}
            </button>
          </div>
        </Card>
      </motion.div>

      {/* ── Maturity breakdown ────────────────────────────────────── */}
      {maturity && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          style={{ marginBottom: 14 }}
        >
          <Card>
            <SectionTitle>Maturity Breakdown</SectionTitle>
            <MaturityBreakdown maturity={maturity} />
          </Card>
        </motion.div>
      )}

      {/* ── Environment variables ─────────────────────────────────── */}
      {requiredVars.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.45 }}
          style={{ marginBottom: 14 }}
        >
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <SectionTitle>Required Environment Variables</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                  color: allConfigured ? "#4ade80" : "#f87171",
                  background: allConfigured ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                  border: `1px solid ${allConfigured ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                }}>
                  {configuredKeys.filter(k => requiredVars.includes(k)).length}/{requiredVars.length} configured
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requiredVars.map(key => (
                <EnvRow
                  key={key}
                  envKey={key}
                  configured={configuredKeys.includes(key)}
                  value={secretInputs[key]}
                  onChange={v => setSecretInputs(p => ({ ...p, [key]: v }))}
                  onSave={() => handleSaveSecret(key)}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Generate ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
      >
        <Card accent={allConfigured ? "#818cf8" : undefined} style={{
          border: allConfigured
            ? "1px solid rgba(129,140,248,0.2)"
            : "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <SectionTitle>Auto-Fix Missing Components</SectionTitle>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
                The agent will generate missing CI/CD configs, Dockerfiles, test scaffolds, and deployment workflows based on the scan results.
              </p>
              {!allConfigured && requiredVars.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: "#f87171" }}>
                  <Icon d={I.alert} size={13} color="#f87171" />
                  Configure all environment variables before generating.
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !allConfigured}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                background: allConfigured
                  ? "linear-gradient(135deg, #818cf8, #6366f1)"
                  : "rgba(255,255,255,0.04)",
                border: allConfigured
                  ? "1px solid rgba(129,140,248,0.4)"
                  : "1px solid rgba(255,255,255,0.07)",
                color: allConfigured ? "#fff" : "#374151",
                cursor: (generating || !allConfigured) ? "not-allowed" : "pointer",
                opacity: generating ? 0.7 : 1,
                boxShadow: allConfigured ? "0 0 24px rgba(99,102,241,0.35)" : "none",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {generating ? <Spinner size={14} /> : <Icon d={I.bolt} size={15} />}
              {generating ? "Preparing…" : "Auto-Fix Missing Components"}
            </button>
          </div>
        </Card>
      </motion.div>

    </div>
  );
}