import { useEffect, useState } from "react";
import api from "../api/axios";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [repositories, setRepositories] = useState([]);
  const [ciStatus, setCiStatus] = useState({});
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===============================
  // Fetch repos
  // ===============================
  useEffect(() => {
    const init = async () => {
      try {
        const repoRes = await api.get("/api/installation/repos");
        setRepositories(repoRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ===============================
  // WebSocket CI
  // ===============================
  useEffect(() => {
    const socket = io("http://localhost:7000");

    socket.on("ciUpdate", (data) => {
      setCiStatus((prev) => ({
        ...prev,
        [data.repo]: data,
      }));
    });

    return () => socket.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Dashboard...
      </div>
    );
  }

  const avgScore =
    repositories.length > 0
      ? Math.round(
          repositories.reduce(
            (acc, r) => acc + (r.lastScan?.maturity?.totalScore || 0),
            0
          ) / repositories.length
        )
      : 0;

  const belowStandard = repositories.filter(
    (r) => (r.lastScan?.maturity?.totalScore || 0) < 50
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">
          DevOps Control Center
        </h1>

        {/* KPI Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Metric title="Repositories" value={repositories.length} />
          <Metric title="Average Maturity" value={`${avgScore}%`} />
          <Metric title="Below Standard" value={belowStandard} highlight />
        </div>

        {/* Repo Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left">Repository</th>
                <th className="px-6 py-4 text-left">Maturity</th>
                <th className="px-6 py-4 text-left">CI</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo) => {
                const score =
                  repo.lastScan?.maturity?.totalScore || 0;

                const ci = ciStatus[repo.fullName];

                return (
                  <tr
                    key={repo.fullName}
                    onClick={() => setSelectedRepo(repo)}
                    className="hover:bg-slate-800 cursor-pointer"
                  >
                    <td className="px-6 py-4">{repo.fullName}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          score >= 75
                            ? "text-emerald-400"
                            : score >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {score}%
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {ci?.status || "Idle"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDE PANEL */}
      {selectedRepo && (
        <RepoPanel
          repo={selectedRepo}
          ciStatus={ciStatus[selectedRepo.fullName]}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </div>
  );
}

function Metric({ title, value, highlight }) {
  return (
    <div
      className={`p-6 rounded-xl border ${
        highlight
          ? "border-red-500/40 bg-red-900/10"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      <div className="text-xs text-slate-500 uppercase mb-2">
        {title}
      </div>
      <div className="text-3xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function RepoPanel({ repo, ciStatus, onClose }) {
  const maturity = repo.lastScan?.maturity;
  const score = maturity?.totalScore || 0;

  return (
    <div className="w-[420px] bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-semibold">{repo.fullName}</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="mb-6">
        <div className="text-4xl font-bold text-emerald-400">
          {score}%
        </div>
        <div className="text-sm text-slate-400">
          DevOps Maturity Index
        </div>
      </div>

      {maturity?.categories &&
        Object.entries(maturity.categories).map(
          ([key, category]) => (
            <div key={key} className="mb-6">
              <h3 className="font-semibold mb-2 capitalize">
                {key}
              </h3>

              <div className="text-sm text-slate-400 mb-2">
                {category.score} / {category.max}
              </div>

              <div className="space-y-2">
                {category.checks.map((check) => (
                  <div
                    key={check.key}
                    className="flex justify-between text-sm"
                  >
                    <span>{check.key}</span>
                    <span
                      className={
                        check.passed
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {check.passed ? "✓" : `+${check.weight}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <div className="text-sm text-slate-400 mb-2">
          CI Status
        </div>
        <div>{ciStatus?.status || "Idle"}</div>
      </div>
    </div>
  );
}
