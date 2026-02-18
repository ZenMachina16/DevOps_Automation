import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { io } from "socket.io-client";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function Scan() {
  const navigate = useNavigate();

  // ===============================
  // Core State
  // ===============================
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [hasInstallation, setHasInstallation] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [installationId, setInstallationId] = useState(null);

  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);

  const [result, setResult] = useState(null);
  const [loadingRepo, setLoadingRepo] = useState(null);
  const [generating, setGenerating] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState("");

  const [socket, setSocket] = useState(null);
  const [ciStatus, setCiStatus] = useState(null);

  // ===============================
  // Helpers
  // ===============================
  const calculateScore = (result) => {
    if (!result) return 0;
    const values = Object.values(result);
    // Rough heuristic: count passing checks
    // Assuming result values are booleans or strings that are truthy
    const trueCount = [result.dockerfile, result.ci, result.readme, result.tests].filter(Boolean).length;
    return Math.round((trueCount / 4) * 100);
  };

  const getRiskMeta = (score) => {
    if (score >= 75)
      return { label: "Healthy", color: "text-emerald-400" };
    if (score >= 40)
      return { label: "Moderate", color: "text-yellow-400" };
    return { label: "Critical", color: "text-red-400" };
  };

  const buildChecks = (result) => {
    if (!result) return [];
    return [
      { label: "Dockerfile", value: result.dockerfile },
      { label: "CI/CD", value: result.ci },
      { label: "README", value: result.readme },
      { label: "Tests", value: result.tests },
    ];
  };

  const fetchRepositories = async () => {
    try {
      const repoRes = await api.get("/api/installation/repos");
      setRepositories(repoRes.data);
    } catch (err) {
      console.error("Failed to refresh repositories", err);
    }
  };

  // ===============================
  // Auth
  // ===============================
  useEffect(() => {
    const init = async () => {
      try {
        const statusRes = await api.get("/auth/status");

        if (!statusRes.data.loggedIn) {
          navigate("/", { replace: true });
          return;
        }

        setLoggedIn(true);
        setHasInstallation(statusRes.data.hasInstallation);
        setInstallationId(statusRes.data.installationId || null);

        if (statusRes.data.hasInstallation) {
          await fetchRepositories();
        }
      } catch (err) {
        navigate("/", { replace: true });
      } finally {
        setCheckingStatus(false);
      }
    };

    init();
  }, [navigate]);

  // ===============================
  // WebSocket
  // ===============================
  useEffect(() => {
    const s = io("http://localhost:7000", { withCredentials: true });
    setSocket(s);

    s.on("ciUpdate", (data) => {
      console.log("Websocket CI Update:", data);
      setCiStatus((prev) => ({ ...prev, ...data }));
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket && selectedRepo) {
      socket.emit("joinRepo", selectedRepo);
      // Reset CI status when changing repos? Maybe keep it if relevant.
      setCiStatus(null);
    }
  }, [socket, selectedRepo]);

  // ===============================
  // Actions
  // ===============================
  const handleLogout = async () => {
    await api.post("/auth/logout");
    window.location.href = "/";
  };

  const scanRepo = async (repoFullName) => {
    setSelectedRepo(repoFullName);
    setLoadingRepo(repoFullName);
    setResult(null);

    try {
      const res = await api.post("/api/scan", { repoFullName });
      setResult(res.data);
    } catch (err) {
      setError("Scan failed");
    } finally {
      setLoadingRepo(null);
    }
  };

  const onGenerateFiles = async () => {
    if (!selectedRepo) return;
    setGenerating(true);
    setError("");

    try {
      // 1. Start generation session
      const res = await api.post("/api/generate-files", {
        repoFullName: selectedRepo,
      });

      if (res.data.success) {
        // 2. Redirect to session page
        navigate(`/session/${res.data.sessionId}`);
      } else {
        setError(res.data.error || "Generation failed");
        setGenerating(false);
      }
    } catch {
      setError("Generation failed");
      setGenerating(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Preparing dashboard…
      </div>
    );
  }

  // Safe checks for rendering
  const score = calculateScore(result);
  const risk = getRiskMeta(score);
  const checks = buildChecks(result);
  // Determine if we should show the generate button (if any check is missing/false)
  const hasMissing = checks.some((c) => !c.value);

  const totalRepos = repositories.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top Nav */}
      <nav className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="text-2xl font-semibold text-white tracking-tight">
            ShipIQ
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/config" className="text-sm text-slate-400 hover:text-white">Settings</Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-white">
            DevOps Command Center
          </h2>
          <p className="text-slate-400 mt-2">
            Real-time CI intelligence across your repositories
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <MetricCard label="Total Repositories" value={totalRepos} />
          <MetricCard
            label="Selected Repository"
            value={selectedRepo || "None"}
          />
          <MetricCard
            label="Live CI Status"
            value={
              ciStatus
                ? (ciStatus.status || "UNKNOWN").toUpperCase()
                : "IDLE"
            }
          />
        </div>

        {/* Repository Grid */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-300">Repositories</h3>
          <a
            href={`${import.meta.env.VITE_API_URL || "http://localhost:7000"}/auth/github-app/configure`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-800"
            title="Add/Remove Repositories"
          >
            <PlusIcon className="h-4 w-4" />
            Manage Repos
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-h-96 overflow-y-auto pr-2">
          {repositories.map((repo) => (
            <RepoCard
              key={repo.fullName}
              repo={repo}
              loadingRepo={loadingRepo}
              ciStatus={ciStatus}
              scanRepo={scanRepo}
              isSelected={selectedRepo === repo.fullName}
            />
          ))}
        </div>

        {/* Result Panel */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">
                {selectedRepo} Report
              </h3>
              <span className={`${risk.color} font-medium px-3 py-1 bg-slate-800 rounded-full border border-slate-700`}>
                {risk.label} Risk
              </span>
            </div>

            {/* CI Status Banner */}
            {ciStatus && ciStatus.repo === selectedRepo && (
              <div className="mb-8 p-5 rounded-xl bg-slate-800/50 border border-slate-700 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
                    <span className="text-lg font-semibold text-blue-200">
                      CI Job Running: {ciStatus.name || "Workflow"}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">
                    Status: {ciStatus.status}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* Score */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-2xl border border-slate-800 w-full md:w-64">
                <div className="text-6xl font-bold text-emerald-400 mb-2">
                  {score}%
                </div>
                <p className="text-slate-400 uppercase text-xs tracking-wider">Health Score</p>
              </div>

              {/* Checks */}
              <div className="flex-grow grid md:grid-cols-2 gap-4">
                {checks.map((check) => (
                  <div
                    key={check.label}
                    className={`p-5 rounded-xl border flex items-center justify-between ${check.value
                      ? "bg-emerald-900/10 border-emerald-900/50"
                      : "bg-red-900/10 border-red-900/50"
                      }`}
                  >
                    <div>
                      <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                        {check.label}
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${check.value ? "text-emerald-500" : "text-red-500"}`}>
                      {check.value ? "PASSED" : "MISSING"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasMissing && (
              <div className="mt-8 border-t border-slate-800 pt-8 flex justify-end">
                <Button
                  onClick={onGenerateFiles}
                  disabled={generating}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 text-lg shadow-lg shadow-purple-900/20"
                >
                  {generating
                    ? "🤖 AI Agent Working..."
                    : "✨ Auto-Fix Missing Components"}
                </Button>
              </div>
            )}

            {error && <p className="mt-4 text-red-400 text-right">{error}</p>}

          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ===============================
   Components
   =============================== */

function MetricCard({ label, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
      <p className="text-sm text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-white mt-2 truncate font-mono">
        {value}
      </p>
    </div>
  );
}

function RepoCard({ repo, loadingRepo, ciStatus, scanRepo, isSelected }) {
  const isRunning =
    ciStatus?.repo === repo.fullName &&
    ciStatus.status === "in_progress";

  const isSuccess =
    ciStatus?.repo === repo.fullName &&
    ciStatus.status === "success";

  const isFailure =
    ciStatus?.repo === repo.fullName &&
    ciStatus.status === "failure";

  let borderColor = "border-slate-800";
  if (isSelected) borderColor = "border-purple-500";
  else if (isRunning) borderColor = "border-yellow-500";
  else if (isSuccess) borderColor = "border-emerald-500";
  else if (isFailure) borderColor = "border-red-500";

  return (
    <div
      onClick={() => scanRepo(repo.fullName)}
      className={`cursor-pointer p-6 rounded-2xl border transition-all duration-200
        bg-slate-900 hover:bg-slate-800/80 ${borderColor}
        ${isSelected ? "ring-1 ring-purple-500 bg-slate-800" : ""}
      `}
    >
      <div className="flex justify-between items-start">
        <p className="font-medium text-white truncate w-3/4">
          {repo.fullName}
        </p>
        {repo.private && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Pv</span>}
      </div>

      <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
        {loadingRepo === repo.fullName ? (
          <>
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
            Scanning...
          </>
        ) : (
          "Click to analyze"
        )}
      </p>
    </div>
  );
}
