import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get("/api/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Dashboard load failed", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-slate-400">
        Loading organization overview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400">
        {error}
      </div>
    );
  }

  const {
    totalRepositories = 0,
    averageMaturity = 0,
    repositories = [],
  } = data || {};

  // ✅ Use maturityScore (NOT maturity.totalScore)
  const analyzedRepos = repositories.filter(
    (r) => r.maturityScore !== null
  );

  const belowStandard = analyzedRepos.filter(
    (r) => r.maturityScore < 50
  );

  const healthy = analyzedRepos.filter(
    (r) => r.maturityScore >= 75
  );

  const moderate = analyzedRepos.filter(
    (r) =>
      r.maturityScore >= 50 &&
      r.maturityScore < 75
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Organization Overview
        </h1>
        <p className="text-slate-400 mt-1">
          DevOps maturity and CI health across all repositories.
        </p>
      </div>

      {/* 🔥 Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <MetricCard
          title="Total Repositories"
          value={totalRepositories}
        />

        <MetricCard
          title="Average Maturity"
          value={`${averageMaturity || 0}%`}
        />

        <MetricCard
          title="Below Standard"
          value={belowStandard.length}
          highlight={belowStandard.length > 0}
        />

        <MetricCard
          title="Healthy Repos"
          value={healthy.length}
        />

      </div>

      {/* ⚠ Attention Required */}
      {belowStandard.length > 0 && (
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-4">
            Attention Required
          </h2>

          <div className="space-y-3">
            {belowStandard.map((repo) => (
              <div
                key={repo.fullName}
                className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-lg px-4 py-3"
              >
                <div>
                  <div className="text-white font-medium">
                    {repo.fullName}
                  </div>
                  <div className="text-sm text-slate-500">
                    Maturity Score: {repo.maturityScore}%
                  </div>
                </div>

                <div className="text-red-400 font-semibold">
                  {repo.maturityLevel}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 Maturity Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Maturity Distribution
        </h2>

        <div className="space-y-4">

          <ProgressBar
            label="Healthy (75%+)"
            count={healthy.length}
            total={totalRepositories}
            color="bg-emerald-500"
          />

          <ProgressBar
            label="Moderate (50–74%)"
            count={moderate.length}
            total={totalRepositories}
            color="bg-yellow-500"
          />

          <ProgressBar
            label="Below Standard (<50%)"
            count={belowStandard.length}
            total={totalRepositories}
            color="bg-red-500"
          />

        </div>
      </div>

    </div>
  );
}

/* ===============================
   Metric Card Component
=============================== */
function MetricCard({ title, value, highlight }) {
  return (
    <div
      className={`bg-slate-900 border rounded-xl p-6 ${
        highlight
          ? "border-red-500/40 shadow-lg shadow-red-900/10"
          : "border-slate-800"
      }`}
    >
      <div className="text-sm text-slate-400 mb-2">
        {title}
      </div>
      <div className="text-3xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

/* ===============================
   Progress Bar Component
=============================== */
function ProgressBar({ label, count, total, color }) {
  const percentage =
    total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">
          {count} repos
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
