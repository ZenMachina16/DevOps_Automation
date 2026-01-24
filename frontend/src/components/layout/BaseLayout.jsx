import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function BaseLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    { id: "hero", label: "Home" },
    { id: "pipeline", label: "Pipeline" },
    { id: "workflow", label: "Workflow" },
    { id: "features", label: "Features" },
    { id: "faq", label: "FAQ" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/user");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    const header = document.querySelector("header");
    const headerHeight = header ? header.offsetHeight : 0;

    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/20 backdrop-blur-md border border-white/30 shadow-md py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ShipIQ</h1>

        <div className="flex items-center gap-4">
          {/* Navigation */}
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className="text-gray-200 hover:text-white px-3 py-1 rounded transition-colors"
            >
              {sec.label}
            </button>
          ))}

          {/* Sign in only (landing responsibility) */}
          {!loading && !user && (
            <a
              href="http://localhost:7000/auth/github"
              className="inline-flex items-center px-5 py-2 bg-black text-white font-semibold rounded-lg hover:scale-105 transition-transform"
            >
              <img src="/github.svg" alt="GitHub" className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </a>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="pt-24">{children}</main>
    </div>
  );
}
