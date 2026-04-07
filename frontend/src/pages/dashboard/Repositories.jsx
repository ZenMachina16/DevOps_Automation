// src/pages/Dashboard/Repositories.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS = {
  HEALTHY:          { label: "Healthy",          color: "#4ade80", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.25)"  },
  NEEDS_IMPROVEMENT:{ label: "Needs Improvement", color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  },
  CRITICAL:         { label: "Critical",          color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  NOT_ANALYZED:     { label: "Not Analyzed",      color: "#6b7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.2)"  },
};

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ScoreBadge({ score }) {
  if (score === null) return <span style={{ color: "#374151", fontSize: 13 }}>—</span>;
  const color = score >= 75 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  const bg    = score >= 75 ? "rgba(74,222,128,0.08)" : score >= 50 ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Mini bar */}
      <div style={{ width: 48, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: 2, background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, color,
        background: bg, padding: "2px 7px", borderRadius: 6,
        fontVariantNumeric: "tabular-nums",
      }}>
        {score}
      </span>
    </div>
  );
}

function StatusChip({ level }) {
  const s = STATUS[level] ?? STATUS.NOT_ANALYZED;
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function SpinIcon() {
  return (
    <motion.svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" style={{ width: 13, height: 13 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </motion.svg>
  );
}

function SvgIcon({ d, size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size, flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 12, padding: "64px 0", color: "#374151",
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth={1.2}
        strokeLinecap="round" style={{ width: 40, height: 40, opacity: 0.5 }}>
        <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
      <span style={{ fontSize: 13 }}>No repositories found</span>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function RepoRow({ repo, index, scanningRepo, onScan, onNavigate }) {
  const [owner, repoName] = repo.fullName.split("/");
  const isScanning = scanningRepo === repo.fullName;
  const analyzed   = repo.maturityScore !== null;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Repo name */}
      <td style={{ padding: "14px 20px" }}>
        <div
          onClick={() => onNavigate(owner, repoName)}
          style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", gap: 2 }}
        >
          <span style={{
            fontSize: 13, fontWeight: 600, color: "#e5e7eb",
            transition: "color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
            onMouseLeave={e => e.currentTarget.style.color = "#e5e7eb"}
          >
            <span style={{ color: "#4b5563", fontWeight: 400 }}>{owner}/</span>
            {repoName}
          </span>
          {repo.language && (
            <span style={{ fontSize: 10.5, color: "#374151" }}>{repo.language}</span>
          )}
        </div>
      </td>

      {/* Score */}
      <td style={{ padding: "14px 20px" }}>
        <ScoreBadge score={repo.maturityScore} />
      </td>

      {/* Level */}
      <td style={{ padding: "14px 20px" }}>
        <StatusChip level={repo.maturityLevel ?? "NOT_ANALYZED"} />
      </td>

      {/* Last scanned */}
      <td style={{ padding: "14px 20px", fontSize: 12, color: "#4b5563", whiteSpace: "nowrap" }}>
        {formatDate(repo.lastScannedAt)}
      </td>

      {/* Action */}
      <td style={{ padding: "14px 20px", textAlign: "right" }}>
        {!analyzed ? (
          <button
            onClick={() => onScan(repo.fullName)}
            disabled={isScanning}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 7,
              background: isScanning ? "rgba(129,140,248,0.15)" : "rgba(129,140,248,0.15)",
              border: "1px solid rgba(129,140,248,0.3)",
              color: "#818cf8", fontSize: 12, fontWeight: 600,
              cursor: isScanning ? "not-allowed" : "pointer",
              opacity: isScanning ? 0.7 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!isScanning) e.currentTarget.style.background = "rgba(129,140,248,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(129,140,248,0.15)"; }}
          >
            {isScanning ? <SpinIcon /> : (
              <SvgIcon d="M21 12a9 9 0 11-6.219-8.56" size={13} />
            )}
            {isScanning ? "Scanning…" : "Scan Now"}
          </button>
        ) : (
          <button
            onClick={() => onNavigate(owner, repoName)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 7,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#9ca3af", fontSize: 12, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            View
            <SvgIcon d="M9 5l7 7-7 7" size={11} />
          </button>
        )}
      </td>
    </motion.tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Repositories() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [repos, setRepos]           = useState([]);
  const [error, setError]           = useState(null);
  const [scanningRepo, setScanningRepo] = useState(null);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");

  useEffect(() => {
    api.get("/api/dashboard")
      .then(res => setRepos(res.data.repositories || []))
      .catch(() => setError("Failed to load repositories"))
      .finally(() => setLoading(false));
  }, []);

  const handleScan = async (repoFullName) => {
    try {
      setScanningRepo(repoFullName);
      await api.post("/api/scan", { repoFullName });
      const res = await api.get("/api/dashboard");
      setRepos(res.data.repositories || []);
    } catch {
      alert("Scan failed");
    } finally {
      setScanningRepo(null);
    }
  };

  const handleNavigate = (owner, repoName) => {
    navigate(`/dashboard/repositories/${owner}/${repoName}`);
  };

  // Filter + search
  const filtered = repos.filter(r => {
    const matchSearch = r.fullName.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"      ? true :
      filter === "healthy"  ? r.maturityScore >= 75 :
      filter === "warning"  ? r.maturityScore >= 50 && r.maturityScore < 75 :
      filter === "critical" ? r.maturityScore < 50 && r.maturityScore !== null :
      filter === "unscanned"? r.maturityScore === null :
      true;
    return matchSearch && matchFilter;
  });

  // Summary counts
  const counts = {
    total:    repos.length,
    healthy:  repos.filter(r => r.maturityScore >= 75).length,
    warning:  repos.filter(r => r.maturityScore >= 50 && r.maturityScore < 75).length,
    critical: repos.filter(r => r.maturityScore !== null && r.maturityScore < 50).length,
    unscanned:repos.filter(r => r.maturityScore === null).length,
  };

  const FILTERS = [
    { key: "all",      label: "All",       count: counts.total    },
    { key: "healthy",  label: "Healthy",   count: counts.healthy  },
    { key: "warning",  label: "Warning",   count: counts.warning  },
    { key: "critical", label: "Critical",  count: counts.critical },
    { key: "unscanned",label: "Unscanned", count: counts.unscanned},
  ];

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#fff",
      padding: "0 0 60px",
    }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em" }}>Dashboard</span>
          <SvgIcon d="M9 5l7 7-7 7" size={11} />
          <span style={{ fontSize: 11, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Repositories</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Repositories</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 5 }}>
          {counts.total} connected · {counts.unscanned} pending analysis
        </p>
      </motion.div>

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4b5563", fontSize: 13 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#818cf8", borderRadius: "50%" }}
          />
          Loading repositories…
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, color: "#f87171", fontSize: 13,
        }}>
          <SvgIcon d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" size={16} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Search + filters ─────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "0 0 240px" }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#374151" }}>
                <SvgIcon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14} />
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search repositories…"
                style={{
                  width: "100%", paddingLeft: 32, paddingRight: 12,
                  height: 34, borderRadius: 8, fontSize: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e5e7eb", outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(129,140,248,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: 5 }}>
              {FILTERS.map(f => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 500,
                      cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                      background: active ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.03)",
                      borderColor: active ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.07)",
                      color: active ? "#818cf8" : "#4b5563",
                    }}
                  >
                    {f.label}
                    <span style={{
                      fontSize: 10, fontWeight: 700, minWidth: 16, textAlign: "center",
                      background: active ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.06)",
                      borderRadius: 4, padding: "0 4px",
                      color: active ? "#818cf8" : "#374151",
                    }}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Table ────────────────────────────────────────────── */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                  {["Repository", "Score", "Maturity Level", "Last Scanned", ""].map((h, i) => (
                    <th key={h+i} style={{
                      padding: "11px 20px",
                      textAlign: i === 4 ? "right" : "left",
                      fontSize: 10, fontWeight: 600, color: "#374151",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((repo, i) => (
                    <RepoRow
                      key={repo.fullName}
                      repo={repo}
                      index={i}
                      scanningRepo={scanningRepo}
                      onScan={handleScan}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filtered.length === 0 && <Empty />}
          </div>

          {/* ── Footer count ─────────────────────────────────────── */}
          {filtered.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 11, color: "#374151", textAlign: "right" }}>
              Showing {filtered.length} of {repos.length} repositories
            </div>
          )}
        </>
      )}
    </div>
  );
}