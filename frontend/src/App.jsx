import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import BaseLayout from "./components/layout/BaseLayout";
import LandingPage from "./pages/Landing/LandingPage.jsx";
import Scan from "./pages/Scan.jsx";
import api from "./api/axios.js";
import Setup from "./pages/Setup.jsx";


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
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
// 🔁 GitHub App Setup Route
// ===============================
function GitHubSetupRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");

    console.log("GitHub installation_id:", installationId);

    // Later you will send this to backend
    // For now just continue to scan
    navigate("/scan", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Setting up GitHub integration...
    </div>
  );
}

// ===============================
// 🌐 Main App Router
// ===============================
export default function App() {
  useEffect(() => {
    document.title = "DevOps Automation Dashboard";
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
      <Setup />
    </ProtectedRoute>
  }
/>


      {/* 🔐 Protected Scan Page */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <Scan />
          </ProtectedRoute>
        }
      />

      {/* 🚫 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
