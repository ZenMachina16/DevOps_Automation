import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { io } from "socket.io-client";
import { PlusIcon } from "@heroicons/react/24/outline";

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
  // eslint-disable-next-line no-unused-vars
  const [installationId, setInstallationId] = useState(null);

  const [repositories, setRepositories] = useState([]);

  // Real-time status
  const [socket, setSocket] = useState(null);
  const [ciStatus, setCiStatus] = useState(null);

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
        Preparing dashboard…
      </div>
    );
  }

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
            label="Monitored Repos"
            value={totalRepos}
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
              ciStatus={ciStatus}
              onClick={handleRepoClick}
            />
          ))}
        </div>
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

function RepoCard({ repo, ciStatus, onClick }) {
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
  if (isRunning) borderColor = "border-yellow-500";
  else if (isSuccess) borderColor = "border-emerald-500";
  else if (isFailure) borderColor = "border-red-500";

  return (
    <div
      onClick={() => onClick(repo.fullName)}
      className={`cursor-pointer p-6 rounded-2xl border transition-all duration-200
        bg-slate-900 hover:bg-slate-800/80 ${borderColor}
      `}
    >
      <div className="flex justify-between items-start">
        <p className="font-medium text-white truncate w-3/4">
          {repo.fullName}
        </p>
        {repo.private && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Pv</span>}
      </div>

      <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
        Click to manage & scan
      </p>
    </div>
  );
}
