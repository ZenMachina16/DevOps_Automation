import { useEffect, useState, useMemo } from "react";
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

  const [mode, setMode] = useState("production");

  const [secrets, setSecrets] = useState([]);
  const [secretInputs, setSecretInputs] = useState({});

  /* ===============================
     Load Repository Data
  =============================== */
  const loadRepo = async () => {
    try {
      const res = await api.get(`/api/repo/${owner}/${repoName}`);
      setRepoData(res.data);
      setActiveSession(res.data.activeSession || null);

      const secretRes = await api.get(
        `/api/repo/${owner}/${repoName}/secrets`
      );
      setSecrets(secretRes.data || []);
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

  /* ===============================
     Required ENV Logic
  =============================== */

  const requiredVars = scanData?.raw?.envVars || [];

  const configuredKeys = useMemo(
    () => secrets.map((s) => s.key),
    [secrets]
  );

  const missingVars = requiredVars.filter(
    (v) => !configuredKeys.includes(v)
  );

  const allConfigured =
    requiredVars.length > 0 && missingVars.length === 0;

  /* ===============================
     Save Secret
  =============================== */

  const handleSaveSecret = async (key) => {
    const value = secretInputs[key];
    if (!value) return;

    await api.post("/api/secrets/save", {
      repoFullName,
      key,
      value,
    });

    setSecretInputs((prev) => ({ ...prev, [key]: "" }));
    await loadRepo();
  };

  /* ===============================
     Manual Scan
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
     Generate Files (Blocked if Missing ENV)
  =============================== */
  const handleGenerate = async () => {
    if (!allConfigured) {
      alert("Configure all required environment variables first.");
      return;
    }

    setGenerating(true);

    try {
      await api.post("/api/secrets/sync", {
        repoFullName,
      });

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

  if (loading)
    return <div className="text-slate-400">Loading...</div>;

  if (error)
    return <div className="text-red-400">{error}</div>;

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

      {/* MODE TOGGLE */}
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
          {scanning
            ? "Scanning..."
            : `Run ${mode === "production" ? "Production" : "Demo"} Scan`}
        </button>
      </div>

      {/* ENVIRONMENT SETUP (AFTER SCAN) */}
      {requiredVars.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Required Environment Variables
          </h2>

          {requiredVars.map((key) => {
            const configured = configuredKeys.includes(key);

            return (
              <div
                key={key}
                className="flex justify-between items-center border border-slate-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  {configured ? (
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  )}
                  <span className="text-white">{key}</span>
                </div>

                {!configured && (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter value"
                      value={secretInputs[key] || ""}
                      onChange={(e) =>
                        setSecretInputs((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                    />
                    <button
                      onClick={() => handleSaveSecret(key)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* GENERATE */}
      <div className="bg-slate-900 border border-purple-700/40 rounded-xl p-6">
        <button
          onClick={handleGenerate}
          disabled={generating || !allConfigured}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-50"
        >
          {generating
            ? "Preparing Production Setup..."
            : "✨ Auto-Fix Missing Components"}
        </button>

        {!allConfigured && requiredVars.length > 0 && (
          <div className="text-red-400 text-sm mt-3">
            Configure all required environment variables before generation.
          </div>
        )}
      </div>
    </div>
  );
}