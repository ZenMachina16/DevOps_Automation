import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function Scan() {
  const navigate = useNavigate();

  // ===============================
  // State
  // ===============================
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [hasInstallation, setHasInstallation] = useState(false);

  // repos = [{ fullName }]
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");

  const [result, setResult] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const renderStatus = (value) => (value ? "✅" : "❌");

  // ===============================
  // 🔐 Auth + Installation Guard
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

        if (statusRes.data.hasInstallation) {
          const repoRes = await api.get("/api/installation/repos");
          setRepositories(repoRes.data); // [{ fullName }]
        }
      } catch (err) {
        console.error("Scan init failed:", err);
        navigate("/", { replace: true });
      } finally {
        setCheckingStatus(false);
      }
    };

    init();
  }, [navigate]);

  // ===============================
  // Logout
  // ===============================
  const handleLogout = async () => {
    await api.post("/auth/logout");
    window.location.href = "/";
  };

  // ===============================
  // Scan Repo ✅ FIXED PATH
  // ===============================
  const onScan = async (e) => {
    e.preventDefault();

    if (!selectedRepo) {
      setError("Please select a repository");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setGeneratedFiles(null);

    try {
      const res = await api.post("/api/scan", {
        repoFullName: selectedRepo,
      });

      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Generate Missing Files ✅ FIXED PATH
  // ===============================
  const onGenerateFiles = async () => {
    if (!selectedRepo) return;

    setGenerating(true);
    setError("");
    setGeneratedFiles(null);

    try {
      const res = await api.post("/api/generate-files", {
        repoFullName: selectedRepo,
      });

      if (res.data.success) {
        setGeneratedFiles(res.data.generatedFiles);
      } else {
        setError(res.data.error || "Generation failed");
      }
    } catch {
      setError("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // ===============================
  // ⏳ Loading
  // ===============================
  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Preparing dashboard…
      </div>
    );
  }

  // ===============================
  // 🚫 No Installation
  // ===============================
  if (loggedIn && !hasInstallation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">
            GitHub App not connected
          </h2>
          <p className="text-slate-600 mb-6">
            Install the ShipIQ GitHub App to scan repositories.
          </p>
          <Button onClick={() => navigate("/setup")} className="w-full">
            Go to Setup
          </Button>
        </div>
      </div>
    );
  }

  // ===============================
  // 🚀 Main UI
  // ===============================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            ShipIQ
          </Link>

          <div className="flex items-center gap-6">
            <span className="text-emerald-600 font-medium">Scan</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-2">Repository Scan</h2>
        <p className="text-slate-600 mb-8">
          Analyze repositories using your GitHub App installation
        </p>

        <div className="bg-white rounded-xl p-6 shadow border">
          <form onSubmit={onScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Repository
              </label>

              <div className="relative">
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 pr-10"
                >
                  <option value="">Choose a repository…</option>
                  {repositories.map((repo) => (
                    <option
                      key={repo.fullName}
                      value={repo.fullName}
                    >
                      {repo.fullName}
                    </option>
                  ))}
                </select>

                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Scanning…" : "Scan Repository"}
            </Button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 bg-white p-6 rounded-xl shadow"
          >
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              Analyzing repository…
            </div>
          </motion.div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="mt-8 bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-4">Results</h3>

            <table className="w-full text-sm border">
              <tbody>
                <tr>
                  <td className="border px-4 py-2">Dockerfile</td>
                  <td className="border px-4 py-2">
                    {renderStatus(result.dockerfile)}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">CI/CD</td>
                  <td className="border px-4 py-2">
                    {renderStatus(result.ci)}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">README</td>
                  <td className="border px-4 py-2">
                    {renderStatus(result.readme)}
                  </td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Tests</td>
                  <td className="border px-4 py-2">
                    {renderStatus(result.tests)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6">
              <Button
                onClick={onGenerateFiles}
                disabled={generating}
                className="w-full"
              >
                {generating
                  ? "Generating files with AI…"
                  : "🤖 Generate Missing Files"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
