// src/pages/Landing/Sections/FAQSection.jsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "What exactly does the agent do?",
    a: "The agent continuously monitors your repositories and CI/CD pipelines. It scans for failing tests, security vulnerabilities, outdated dependencies, and policy violations — then autonomously opens pull requests with fixes, triggers deployments, and generates detailed audit reports. All without manual intervention.",
    tag: "Core",
    color: "#818cf8",
  },
  {
    q: "Do I need DevOps experience to use this?",
    a: "Not at all. The agent is designed for both technical engineers and non-technical stakeholders. Engineers get granular control over policies and pipeline config, while PMs and executives get clean dashboards and plain-English reports on every run.",
    tag: "Onboarding",
    color: "#34d399",
  },
  {
    q: "Which pipelines and platforms are supported?",
    a: "We support GitHub Actions, GitLab CI, CircleCI, Jenkins, and Bitbucket Pipelines out of the box. Deployments work with AWS, GCP, Azure, Vercel, Fly.io, Railway, and any platform with a CLI or API. Custom integrations are available on the Enterprise plan.",
    tag: "Integrations",
    color: "#22d3ee",
  },
  {
    q: "How does the agent handle mistakes or false positives?",
    a: "Every action the agent takes is logged with a full rationale. You can configure human-approval gates for any step — deployments, PR merges, config changes — so nothing irreversible happens without sign-off. You can also roll back any agent action with a single click.",
    tag: "Safety",
    color: "#fbbf24",
  },
  {
    q: "Is my codebase kept private and secure?",
    a: "Yes. The agent operates with read/write access only to repos you explicitly authorize. Code is never stored on our servers — analysis runs ephemerally. All data is encrypted in transit and at rest. We are SOC 2 Type II certified and GDPR compliant.",
    tag: "Security",
    color: "#a78bfa",
  },
  {
    q: "What does pricing look like?",
    a: "We offer a free tier for solo developers covering up to 3 repos and 50 agent runs per month. Team plans start at $49/month for up to 10 seats. Enterprise pricing is custom — reach out and we'll build a plan around your deployment volume and compliance requirements.",
    tag: "Pricing",
    color: "#f472b6",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section
      id="faq"
      className="relative py-32 px-6 bg-[#050b12] overflow-hidden"
    >
      {/* Top border shimmer */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(129,140,248,.3),transparent)" }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse,rgba(79,70,229,.07),transparent 70%)",
          filter: "blur(1px)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-5 tracking-wide uppercase"
            style={{
              borderColor: "rgba(255,255,255,.08)",
              background: "rgba(255,255,255,.03)",
              color: "#6b7280",
            }}
          >
            FAQ
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Questions we{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg,#818cf8 0%,#34d399 100%)",
              }}
            >
              actually get asked
            </span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed max-w-lg mx-auto" style={{ color: "#6b7280" }}>
            Everything you need to know before connecting your first pipeline.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: idx * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  onClick={() => toggle(idx)}
                  className="group relative rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300"
                  style={{
                    background: isOpen ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.02)",
                    borderColor: isOpen ? `${faq.color}40` : "rgba(255,255,255,.07)",
                    boxShadow: isOpen ? `0 0 0 1px ${faq.color}20, 0 20px 60px rgba(0,0,0,.3)` : "none",
                  }}
                >
                  {/* Top accent line — only when open */}
                  {isOpen && (
                    <div
                      className="absolute inset-x-0 top-0 h-px pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg,transparent,${faq.color},transparent)`,
                        opacity: 0.6,
                      }}
                    />
                  )}

                  {/* Question row */}
                  <div className="flex items-center gap-4 px-6 py-5 select-none">
                    {/* Tag pill */}
                    <span
                      className="hidden sm:block shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border tracking-wide uppercase"
                      style={{
                        color: faq.color,
                        borderColor: `${faq.color}30`,
                        background: `${faq.color}10`,
                        minWidth: "72px",
                        textAlign: "center",
                      }}
                    >
                      {faq.tag}
                    </span>

                    {/* Question */}
                    <h3
                      className="flex-1 font-semibold text-base md:text-lg transition-colors duration-200"
                      style={{ color: isOpen ? "#fff" : "#e5e7eb" }}
                    >
                      {faq.q}
                    </h3>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300"
                      style={{
                        borderColor: isOpen ? `${faq.color}50` : "rgba(255,255,255,.1)",
                        background: isOpen ? `${faq.color}18` : "rgba(255,255,255,.03)",
                        color: isOpen ? faq.color : "#6b7280",
                      }}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        className="w-3.5 h-3.5"
                      >
                        <path d="M8 3v10M3 8h10" />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Answer */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="px-6 pb-6"
                          style={{
                            paddingLeft: "calc(24px + 72px + 16px)",
                          }}
                        >
                          {/* Left color bar */}
                          <div className="flex gap-4">
                            <div
                              className="hidden sm:block w-px shrink-0 rounded-full"
                              style={{
                                background: `linear-gradient(180deg,${faq.color},transparent)`,
                                opacity: 0.4,
                                marginLeft: "-calc(16px + 1px)",
                              }}
                            />
                            <p
                              className="text-sm md:text-base leading-relaxed"
                              style={{ color: "#9ca3af" }}
                            >
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-sm mb-4" style={{ color: "#4b5563" }}>
            Still have questions?
          </p>
          <a
            href="mailto:hello@devopsagent.io"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
            style={{ color: "#818cf8" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#818cf8")}
          >
            Talk to us directly
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}