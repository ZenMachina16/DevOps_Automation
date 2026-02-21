import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function Repositories() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState(null);
  const [scanningRepo, setScanningRepo] = useState(null);

  // ===============================
  // Fetch Dashboard Data
  // ===============================
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await api.get("/api/dashboard");
        setRepos(res.data.repositories || []);
      } catch (err) {
        console.error("Failed to load repositories:", err);
        setError("Failed to load repositories");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  // ===============================
  // Manual Scan Trigger
  // ===============================
  const handleScan = async (repoFullName) => {
    try {
      setScanningRepo(repoFullName);
      await api.post("/api/scan", { repoFullName });

      // Refresh dashboard data after scan
      const res = await api.get("/api/dashboard");
      setRepos(res.data.repositories || []);
    } catch (err) {
      console.error("Scan failed:", err);
      alert("Scan failed");
    } finally {
      setScanningRepo(null);
    }
  };

  // ===============================
  // UI Helpers
  // ===============================
  const getLevelBadge = (level) => {
    switch (level) {
      case "HEALTHY":
        return "bg-emerald-900/30 text-emerald-400 border border-emerald-700";
      case "NEEDS_IMPROVEMENT":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-700";
      case "CRITICAL":
        return "bg-red-900/30 text-red-400 border border-red-700";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <h1 className="text-3xl font-bold text-white mb-6">
        Repositories
      </h1>

      {loading && (
        <p className="text-slate-400">Loading repositories...</p>
      )}

      {error && (
        <p className="text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Repository</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Maturity Level</th>
                <th className="px-6 py-4">Last Scanned</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {repos.map((repo) => {
                const [owner, repoName] = repo.fullName.split("/");

                return (
                  <tr
                    key={repo.fullName}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Repo Name */}
                    <td
                      className="px-6 py-4 font-medium text-white cursor-pointer hover:text-purple-400"
                      onClick={() =>
                        navigate(`/dashboard/repositories/${owner}/${repoName}`)
                      }
                    >
                      {repo.fullName}
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      {repo.maturityScore !== null
                        ? `${repo.maturityScore}/100`
                        : "—"}
                    </td>

                    {/* Maturity Level */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelBadge(
                          repo.maturityLevel
                        )}`}
                      >
                        {repo.maturityLevel === "NOT_ANALYZED"
                          ? "Not Analyzed"
                          : repo.maturityLevel.replace("_", " ")}
                      </span>
                    </td>

                    {/* Last Scan */}
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {formatDate(repo.lastScannedAt)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      {repo.maturityScore === null ? (
                        <button
                          onClick={() =>
                            handleScan(repo.fullName)
                          }
                          disabled={scanningRepo === repo.fullName}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                        >
                          {scanningRepo === repo.fullName && (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          )}
                          Scan Now
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            navigate(`/dashboard/repositories/${owner}/${repoName}`)
                          }
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {repos.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No repositories found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
