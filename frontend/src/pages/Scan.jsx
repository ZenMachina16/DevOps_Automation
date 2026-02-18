import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { io } from "socket.io-client";
import {
  PlusIcon, MagnifyingGlassIcon, ArrowRightIcon,
  CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, PlayIcon
} from "@heroicons/react/24/outline";

export default function Scan() {
  const navigate = useNavigate();

  // ===============================
  // Core State
  // ===============================
  const [checkingStatus, setCheckingStatus] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [loggedIn, setLoggedIn] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [hasInstallation, setHasInstallation] = useState(false);

  const [repositories, setRepositories] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Real-time status
  const [socket, setSocket] = useState(null);
  const [ciStatus, setCiStatus] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, healthy, risk

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
        const [statusRes, healthRes] = await Promise.all([
          api.get("/auth/status"),
          api.get("http://localhost:7000/health") // Use direct URL or proxy if configured
        ]);

        if (!statusRes.data.loggedIn) {
          navigate("/", { replace: true });
          return;
        }

        setLoggedIn(true);
        setHasInstallation(statusRes.data.hasInstallation);
        setSystemHealth(healthRes.data);

        if (statusRes.data.hasInstallation) {
          await fetchRepositories();
        }
      } catch (err) {
        // If auth fails, redirect. If health fails, just log it.
        if (err.response?.status === 401) {
          navigate("/", { replace: true });
        }
        console.error("Init failed", err);
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

  // Listen to all user repos
  useEffect(() => {
    if (socket && repositories.length > 0) {
      repositories.forEach(repo => {
        socket.emit("joinRepo", repo.fullName);
      });
    }
  }, [socket, repositories]);


  // ===============================
  // Actions
  // ===============================
  const handleLogout = async () => {
    await api.post("/auth/logout");
    window.location.href = "/";
  };

  const handleRepoClick = (repoFullName) => {
    navigate(`/repo/${repoFullName}`);
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading Dashboard...
      </div>
    );
  }

  // ===============================
  // Derived State (Filtering)
  // ===============================
  const filteredRepos = repositories.filter(repo => {
    const matchesSearch = repo.fullName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'healthy') return matchesSearch && repo.health === 'healthy';
    if (filter === 'at_risk') return matchesSearch && repo.health === 'at_risk';

    return matchesSearch;
  });

  const activePipelineCount = ciStatus?.status === 'in_progress' ? 1 : 0;

  // Calculate stats for cards
  const riskCount = repositories.filter(r => r.health === 'at_risk').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Top Nav */}
      <nav className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ShipIQ</span>
          </Link>
          <div className="flex items-center gap-6">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-400 mt-1">Overview of your repository automation status.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:7000"}/auth/github-app/configure`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Manage Repos
            </a>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard
            label="Total Repositories"
            value={repositories.length}
            icon={<div className="h-2 w-2 rounded-full bg-slate-400" />}
          />
          <MetricCard
            label="At Risk Repos"
            value={riskCount}
            subtext={riskCount > 0 ? "Requires attention" : "All healthy"}
            highlight={riskCount > 0}
            icon={<ExclamationTriangleIcon className="h-4 w-4 text-orange-400" />}
          />
          <MetricCard
            label="Active Pipelines"
            value={activePipelineCount}
            subtext={activePipelineCount > 0 ? "Running now" : "All idle"}
            highlight={activePipelineCount > 0}
            icon={<PlayIcon className="h-4 w-4 text-blue-400" />}
          />
          <MetricCard
            label="System Status"
            value={systemHealth?.status === 'ok' ? "Operational" : "Degraded"}
            subtext={
              systemHealth?.services?.n8n !== "configured"
                ? "AI Agent Disconnected"
                : "All Systems Go"
            }
            highlight={systemHealth?.status !== 'ok'}
            icon={
              systemHealth?.status === 'ok'
                ? <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                : <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 animate-pulse" />
            }
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-t-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search repositories..."
              className="w-full bg-slate-950 border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-purple-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'healthy', 'at_risk'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wide transition-colors ${filter === f
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Repositories Table/List */}
        <div className="bg-slate-900 border-x border-b border-slate-800 rounded-b-xl overflow-hidden">
          {filteredRepos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-800 mb-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white">No repositories found</h3>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Repository</th>
                    <th className="px-6 py-4 font-medium">Status Check</th>
                    <th className="px-6 py-4 font-medium">CI Pipeline</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRepos.map((repo) => (
                    <RepoRow
                      key={repo.fullName}
                      repo={repo}
                      ciStatus={ciStatus}
                      onClick={handleRepoClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ===============================
   Components
   =============================== */

function MetricCard({ label, value, subtext, highlight, icon }) {
  return (
    <div className={`bg-slate-900 border rounded-xl p-6 transition-all ${highlight ? 'border-blue-500/50 shadow-lg shadow-blue-900/10' : 'border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {subtext && <span className="text-sm text-slate-500">{subtext}</span>}
      </div>
    </div>
  );
}

function RepoRow({ repo, ciStatus, onClick }) {
  const isRunning = ciStatus?.repo === repo.fullName && ciStatus.status === "in_progress";
  const isSuccess = ciStatus?.repo === repo.fullName && ciStatus.status === "success";
  const isFailure = ciStatus?.repo === repo.fullName && ciStatus.status === "failure";

  // FIX: Safely derive name if repo.name is missing
  const safeName = repo.name || (repo.fullName ? repo.fullName.split('/')[1] : "?");

  return (
    <tr
      onClick={() => onClick(repo.fullName)}
      className="group hover:bg-slate-800/50 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
            {safeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-base font-medium text-white group-hover:text-purple-400 transition-colors">
              {repo.fullName}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              {repo.private && <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 border border-slate-700">PRIVATE</span>}
              <span>Updated recently</span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        {repo.health === 'healthy' ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-300">Healthy</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-sm text-orange-300 font-medium">At Risk</span>
          </div>
        )}
      </td>

      {/* CI Status Column */}
      <td className="px-6 py-4">
        {isRunning && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-900/20 border border-blue-900/50 text-blue-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Running...
          </div>
        )}
        {isSuccess && (
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircleIcon className="h-5 w-5" />
            Passed
          </div>
        )}
        {isFailure && (
          <div className="inline-flex items-center gap-1.5 text-red-400 text-sm">
            <XCircleIcon className="h-5 w-5" />
            Failed
          </div>
        )}
        {!isRunning && !isSuccess && !isFailure && (
          <span className="text-xs text-slate-600">No active run</span>
        )}
      </td>

      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-white group-hover:translate-x-1 transition-transform">
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}
