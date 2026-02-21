import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import BaseLayout from "./components/layout/BaseLayout";
import LandingPage from "./pages/Landing/LandingPage.jsx";
import api from "./api/axios.js";
import Setup from "./pages/Setup.jsx";
import Config from "./pages/Config.jsx";

// 🆕 Dashboard Architecture
import DashboardLayout from "./layouts/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Repositories from "./pages/dashboard/Repositories";
import RepositoryDetails from "./pages/dashboard/RepositoryDetails";
import Insights from "./pages/dashboard/Insights";
import Settings from "./pages/dashboard/Settings";

// ===============================
// 🔒 Protected Route Wrapper
// ===============================
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/user");
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/?auth=required" replace />;
  }

  return children;
}

// ===============================
// 🔁 GitHub App Setup Redirect
// ===============================
function GitHubSetupRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");

    console.log("GitHub installation_id:", installationId);

    // After installation → go to dashboard
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
      Setting up GitHub integration...
    </div>
  );
}

// ===============================
// 🌐 Main App Router
// ===============================
export default function App() {
  useEffect(() => {
    document.title = "ShipIQ – DevOps Control Platform";
  }, []);

  return (
    <Routes>

      {/* 🏠 Landing Page */}
      <Route
        path="/"
        element={
          <BaseLayout>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <LandingPage />
            </motion.div>
          </BaseLayout>
        }
      />

      {/* 🔁 GitHub Setup Redirect */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <GitHubSetupRedirect />
          </ProtectedRoute>
        }
      />

      {/* 🆕 DASHBOARD (Protected Nested Layout) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Overview */}
        <Route index element={<Overview />} />

        {/* Repositories List */}
        <Route path="repositories" element={<Repositories />} />

        {/* Repository Detail (Nested under dashboard) */}
        <Route
          path="repositories/:owner/:repoName"
          element={<RepositoryDetails />}
        />

        {/* Insights */}
        <Route path="insights" element={<Insights />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 🔐 Protected Config */}
      <Route
        path="/config"
        element={
          <ProtectedRoute>
            <Config />
          </ProtectedRoute>
        }
      />

      {/* 🚫 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
