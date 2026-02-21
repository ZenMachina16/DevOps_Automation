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

  const [mode, setMode] = useState("production"); // 🔥 NEW

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
     Manual Scan (Mode Aware)
  =============================== */
  const handleScan = async () => {
    setScanning(true);
    try {
      let branch = "main";

      if (mode === "demo") {
        if (!repoData?.demoBranch) {
          alert("No demo branch available yet.");
          setScanning(false);
          return;
        }
        branch = repoData.demoBranch;
      }

      await api.post("/api/scan", {
        repoFullName,
        branch,
        mode,
      });

      await loadRepo();
    } catch (err) {
      console.error(err);
      alert("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  /* ===============================
     Generate Files
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
    return <div className="text-red-400">{error}</div>;
  }

  /* ===============================
     Mode Based Scan Selection
  =============================== */
  const scanData =
    mode === "production"
      ? repoData?.lastScanProduction
      : repoData?.lastScanDemo;

  const maturity = scanData?.maturity;
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

      {/* ================= MODE TOGGLE ================= */}
      <div className="flex gap-4">
        <button
          onClick={() => setMode("production")}
          className={`px-4 py-2 rounded-lg text-sm ${
            mode === "production"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          Production Mode
        </button>

        <button
          onClick={() => setMode("demo")}
          className={`px-4 py-2 rounded-lg text-sm ${
            mode === "demo"
              ? "bg-purple-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          Demo Mode
        </button>
      </div>

      {/* ================= AI DEVOPS AGENT ================= */}
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

        {activeSession && (
          <div className="text-sm text-slate-400">
            Session ID: {activeSession.sessionId} <br />
            Status: {activeSession.status}
          </div>
        )}
      </div>

      {/* ================= SUMMARY ================= */}
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
          {scanning
            ? "Scanning..."
            : `Run ${mode === "production" ? "Production" : "Demo"} Scan`}
        </button>
      </div>

      {/* ================= MATURITY BREAKDOWN ================= */}
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