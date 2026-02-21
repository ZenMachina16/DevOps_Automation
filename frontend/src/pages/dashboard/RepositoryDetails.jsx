import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function RepositoryDetails() {
  const { owner, repoName } = useParams();
  const repoFullName = `${owner}/${repoName}`;

  const [loading, setLoading] = useState(true);
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState("");

  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  /* ===============================
     Load Repository Data
  =============================== */
  const loadRepo = async () => {
    try {
      const res = await api.get(`/api/repo/${owner}/${repoName}`);
      setRepoData(res.data);
      setActiveSession(res.data.activeSession || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load repository details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepo();
  }, [owner, repoName]);

  /* ===============================
     Poll Active Session
  =============================== */
  useEffect(() => {
    let interval;

    if (
      activeSession &&
      !["COMPLETED", "FAILED"].includes(activeSession.status)
    ) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(
            `/api/session/${activeSession.sessionId}`
          );

          setActiveSession(res.data);

          if (
            ["COMPLETED", "FAILED"].includes(res.data.status)
          ) {
            clearInterval(interval);
            setTimeout(loadRepo, 2000);
          }
        } catch (err) {
          console.error("Polling failed", err);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [activeSession]);

  /* ===============================
     Manual Scan
  =============================== */
  const handleScan = async () => {
    setScanning(true);
    try {
      await api.post("/api/scan", { repoFullName });
      await loadRepo();
    } catch {
      alert("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  /* ===============================
     Generate (WORKING ENDPOINT)
  =============================== */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/api/generate-files", {
        repoFullName,
      });

      if (res.data.success) {
        setActiveSession({
          sessionId: res.data.sessionId,
          status: "GENERATING",
        });
      } else {
        alert(res.data.error || "Generation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  /* ===============================
     Loading & Error
  =============================== */
  if (loading) {
    return (
      <div className="text-slate-400">
        Loading repository details...
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

  const maturity = repoData?.lastScan?.maturity;
  const totalScore = maturity?.totalScore || 0;

  const getLevelColor = () => {
    if (totalScore >= 80) return "text-emerald-400";
    if (totalScore >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {repoFullName}
        </h1>
        <p className="text-slate-400 mt-1">
          DevOps Intelligence & Automation Control
        </p>
      </div>

      {/* =========================================
          🔥 AI DEVOPS AGENT (NOW AT TOP)
      ========================================== */}
      <div className="bg-slate-900 border border-purple-700/40 rounded-xl p-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-purple-400">
            AI DevOps Agent
          </h2>

          {!activeSession && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white disabled:opacity-50"
            >
              {generating
                ? "Starting Agent..."
                : "✨ Auto-Fix Missing Components"}
            </button>
          )}
        </div>

        {/* Active Session View */}
        {activeSession && (
          <div className="space-y-3 text-sm">

            <div className="flex justify-between text-slate-400">
              <span>Session ID: {activeSession.sessionId}</span>
              <span>Status: {activeSession.status}</span>
            </div>

            <ProgressStep
              label="AI Generation"
              current={activeSession.status}
              step="GENERATING"
            />
            <ProgressStep
              label="Code Created"
              current={activeSession.status}
              step="CODE_CREATED"
            />
            <ProgressStep
              label="Pull Request Opened"
              current={activeSession.status}
              step="PR_OPEN"
            />
            <ProgressStep
              label="CI/CD Running"
              current={activeSession.status}
              step="CI_RUNNING"
            />
            <ProgressStep
              label="Completed"
              current={activeSession.status}
              step="COMPLETED"
            />

          </div>
        )}

      </div>

      {/* SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex justify-between items-center">
        <div>
          <div className="text-sm text-slate-400">
            DevOps Maturity Score
          </div>
          <div className={`text-4xl font-bold ${getLevelColor()}`}>
            {totalScore}%
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700"
        >
          {scanning && (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          )}
          {scanning ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {/* MATURITY BREAKDOWN */}
      {maturity && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">
            Maturity Breakdown
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(maturity.categories).map(
              ([key, category]) => (
                <div
                  key={key}
                  className="border border-slate-800 rounded-lg p-5"
                >
                  <div className="flex justify-between mb-4">
                    <span className="capitalize text-white font-medium">
                      {key}
                    </span>
                    <span className="text-slate-400">
                      {category.score} / {category.max}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {category.checks.map((check) => (
                      <div
                        key={check.key}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-slate-400">
                          {check.key}
                        </span>

                        {check.passed ? (
                          <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ===============================
   Progress Step Component
=============================== */
function ProgressStep({ label, current, step }) {
  const steps = [
    "GENERATING",
    "CODE_CREATED",
    "PR_OPEN",
    "CI_RUNNING",
    "COMPLETED",
  ];

  const currentIndex = steps.indexOf(current);
  const stepIndex = steps.indexOf(step);

  const isDone = stepIndex < currentIndex;
  const isActive = stepIndex === currentIndex;

  return (
    <div className="flex items-center gap-3">
      {isDone ? (
        <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
      ) : isActive ? (
        <ArrowPathIcon className="h-5 w-5 text-purple-400 animate-spin" />
      ) : (
        <div className="h-4 w-4 rounded-full bg-slate-700 border border-slate-600" />
      )}

      <span
        className={
          isDone
            ? "text-emerald-400"
            : isActive
            ? "text-purple-400"
            : "text-slate-500"
        }
      >
        {label}
      </span>
    </div>
  );
}