import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = "http://localhost:7000";

export default function Setup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState("");

  /**
   * ===============================
   * STEP 1: Check auth + installation
   * ===============================
   */
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/auth/status`,
          { withCredentials: true }
        );

        if (!res.data.loggedIn) {
          navigate("/", { replace: true });
          return;
        }

        if (res.data.hasInstallation) {
          navigate("/scan", { replace: true });
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Setup status failed:", err);
        navigate("/", { replace: true });
      }
    };

    checkStatus();
  }, [navigate]);

  /**
   * ===============================
   * STEP 2: Handle GitHub App callback
   * ===============================
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");

    if (!installationId) return;

    const finalizeInstallation = async () => {
      try {
        setInstalling(true);

        console.log("🔗 Linking installation:", installationId);

        // 1️⃣ Save installation
        await axios.post(
          `${BACKEND_URL}/auth/github-app/link-installation`,
          { installationId: Number(installationId) },
          { withCredentials: true }
        );

        // 2️⃣ Sync repositories
        await axios.post(
          `${BACKEND_URL}/api/installation/sync-repos`,
          { installationId: Number(installationId) },
          { withCredentials: true }
        );

        navigate("/scan", { replace: true });
      } catch (err) {
        console.error(
          "❌ Installation finalization failed:",
          err.response?.data || err.message
        );
        setError("Failed to complete GitHub App setup");
        setInstalling(false);
      }
    };

    finalizeInstallation();
  }, [navigate]);

  /**
   * ===============================
   * Loading state
   * ===============================
   */
  if (loading || installing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        {installing
          ? "Finalizing GitHub integration…"
          : "Preparing setup…"}
      </div>
    );
  }

  /**
   * ===============================
   * UI
   * ===============================
   */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border">
        <h1 className="text-2xl font-bold mb-4">
          Connect GitHub to ShipIQ
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          ShipIQ uses a GitHub App to securely analyze repositories
          and automate DevOps workflows.
        </p>

        <ul className="text-sm text-slate-600 dark:text-slate-400 mb-6 list-disc list-inside">
          <li>No password access</li>
          <li>Only selected repositories</li>
          <li>Revoke anytime from GitHub</li>
        </ul>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <a
          href={`${BACKEND_URL}/auth/github-app/install`}
          className="block text-center w-full bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Install GitHub App
        </a>
      </div>
    </div>
  );
}
