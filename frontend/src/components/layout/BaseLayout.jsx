// src/layouts/BaseLayout.jsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import api from "../../api/axios";

const sections = [
  { id: "hero",     label: "Home"     },
  { id: "pipeline", label: "Pipeline" },
  { id: "workflow", label: "Workflow" },
  { id: "features", label: "Features" },
  { id: "faq",      label: "FAQ"      },
];

// ─── Active-section tracker via IntersectionObserver ─────────────────────────
function useActiveSection() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observers = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return active;
}

// ─── Smooth scroll helper ─────────────────────────────────────────────────────
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerHeight = document.querySelector("header")?.offsetHeight ?? 0;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.pageYOffset - headerHeight,
    behavior: "smooth",
  });
}

// ─── Nav link ────────────────────────────────────────────────────────────────
function NavLink({ id, label, active }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => scrollToSection(id)}
      className="relative text-sm font-medium transition-colors duration-200"
      style={{ color: isActive ? "#fff" : "#6b7280" }}
    >
      {label}
      {/* Active indicator dot */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="nav-dot"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Mobile menu ─────────────────────────────────────────────────────────────
function MobileMenu({ open, user, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 w-64 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 200 }}
            style={{
              background: "#080f1a",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Close button */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="font-bold text-white text-sm">ShipIQ</span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-1 p-4">
              {sections.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { scrollToSection(id); onClose(); }}
                  className="text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* CTA */}
            {!user && (
              <div className="mt-auto p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <a
                  href="http://localhost:7000/auth/github"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white text-gray-950 font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Sign in with GitHub
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function BaseLayout({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenu]   = useState(false);
  const active = useActiveSection();

  // Scroll progress → header opacity/blur
  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 60],
    ["rgba(5,11,18,0)", "rgba(5,11,18,0.92)"]
  );
  const headerBorder = useTransform(
    scrollY,
    [0, 60],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"]
  );
  const headerBlur = useTransform(scrollY, [0, 60], [0, 18]);

  // User fetch
  useEffect(() => {
    api.get("/auth/user")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#050b12] text-gray-100">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: headerBg,
          borderBottom: "1px solid",
          borderColor: headerBorder,
          backdropFilter: `blur(${headerBlur}px)`,
          WebkitBackdropFilter: `blur(${headerBlur}px)`,
        }}
      >
        {/* Top shimmer line — only visible at top of page */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
            opacity: useTransform(scrollY, [0, 40], [1, 0]),
          }}
        />

        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-2.5 group"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300 group-hover:scale-105"
              style={{
                background: "rgba(79,70,229,0.15)",
                borderColor: "rgba(129,140,248,0.3)",
              }}
            >
              <svg
                viewBox="0 0 24 24" fill="none" stroke="#818cf8"
                strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">ShipIQ</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {sections.map(({ id, label }) => (
              <NavLink key={id} id={id} label={label} active={active} />
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User avatar (logged in) */}
            {!loading && user && (
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: "rgba(79,70,229,0.2)",
                    borderColor: "rgba(129,140,248,0.3)",
                    color: "#818cf8",
                  }}
                >
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden md:block text-sm text-gray-300 font-medium">
                  {user.name ?? user.login}
                </span>
              </div>
            )}

            {/* GitHub CTA (logged out) */}
            {!loading && !user && (
              <a
                href="http://localhost:7000/auth/github"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-950 font-semibold text-sm transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-white/10 active:translate-y-0"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Sign in with GitHub
              </a>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenu(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors border"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <MobileMenu open={menuOpen} user={user} onClose={() => setMenu(false)} />

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}