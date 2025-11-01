import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import BaseLayout from "./components/layout/BaseLayout";
import LandingPage from "./pages/Landing/LandingPage.jsx";
import Scan from "./pages/Scan.jsx";
import api from "./api/axios.js";

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">
          Checking authentication...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/?auth=required" replace />;
  }

  return children;
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
      {/* =============================== */}
      {/* 🏠 Landing Page with BaseLayout */}
      {/* =============================== */}
      <Route
        path="/"
        element={
          <BaseLayout>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <LandingPage />
            </motion.div>
          </BaseLayout>
        }
      />

      {/* ========================================== */}
      {/* 🔐 Protected Scan Page (No BaseLayout Here) */}
      {/* ========================================== */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <Scan />
          </ProtectedRoute>
        }
      />

      {/* ====================== */}
      {/* 🚫 Fallback Redirection */}
      {/* ====================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
