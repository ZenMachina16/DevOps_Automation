import React from "react";

export default function BaseLayout({ children }) {
  const sections = [
    { id: "hero", label: "Home" },
    { id: "pipeline", label: "Pipeline" },
    { id: "workflow", label: "Workflow" },
    { id: "features", label: "Features" },
    { id: "faq", label: "FAQ" },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    const header = document.querySelector("header");
    const headerHeight = header ? header.offsetHeight : 0;

    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Fixed Header with Glassy Effect */}
      {/* <header className="fixed top-0 w-full z-50 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-black/30 shadow-md py-4 px-8 flex justify-between items-center rounded-b-lg transition-all"> */}
      <header className="fixed top-0 w-full z-50 bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-md py-4 px-8 flex justify-between items-center  transition-all">

        <h1 className="text-2xl font-bold">Agentic AI</h1>

        {/* Section Navigation + GitHub Connect */}
        <div className="flex items-center gap-4">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className="text-gray-200 hover:text-white px-3 py-1 rounded transition-colors"
            >
              {sec.label}
            </button>
          ))}

          <a
            href="/auth/github"
            className="inline-flex items-center px-5 py-2 bg-green-600/80 hover:bg-green-500/80 text-white font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105 backdrop-blur-sm"
          >
            <img src="/github-icon.svg" alt="GitHub" className="w-5 h-5 mr-2" />
            Connect GitHub
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
