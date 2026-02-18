import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function Session() {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);
    const [polling, setPolling] = useState(true);

    // ===============================
    // 🔄 Poll Session Status
    // ===============================
    useEffect(() => {
        let interval;

        const fetchSession = async () => {
            try {
                const res = await api.get(`/api/session/${sessionId}`);
                setSession(res.data);

                // Stop polling if completed or failed
                if (["COMPLETED", "FAILED"].includes(res.data.status)) {
                    setPolling(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Failed to fetch session:", err);
                setError("Failed to load session details.");
                setPolling(false);
                clearInterval(interval);
            }
        };

        fetchSession(); // Initial fetch

        if (polling) {
            interval = setInterval(fetchSession, 3000); // Poll every 3s
        }

        return () => clearInterval(interval);
    }, [sessionId, polling]);

    // ===============================
    // 🎨 UI Helpers
    // ===============================
    const getStepStatus = (step) => {
        if (!session) return "waiting";
        const status = session.status;

        const steps = [
            "GENERATING",
            "CODE_CREATED",
            "PR_OPEN",
            "PR_MERGED",
            "CI_RUNNING",
            "COMPLETED"
        ];

        const currentIndex = steps.indexOf(status);
        const stepIndex = steps.indexOf(step);

        if (status === "FAILED") return "error";
        if (stepIndex < currentIndex) return "completed";
        if (stepIndex === currentIndex) return "active";
        return "waiting";
    };

    const Step = ({ title, description, status }) => {
        let icon = <div className="h-4 w-4 rounded-full bg-slate-200" />;
        let color = "text-slate-400";
        let bgColor = "bg-slate-50";

        if (status === "completed") {
            icon = <CheckCircleIcon className="h-6 w-6 text-emerald-500" />;
            color = "text-emerald-700";
            bgColor = "bg-emerald-50 border-emerald-200";
        } else if (status === "active") {
            icon = <ClockIcon className="h-6 w-6 text-blue-500 animate-pulse" />;
            color = "text-blue-700";
            bgColor = "bg-blue-50 border-blue-200 shadow-md";
        } else if (status === "error") {
            icon = <XCircleIcon className="h-6 w-6 text-red-500" />;
            color = "text-red-700";
            bgColor = "bg-red-50 border-red-200";
        }

        return (
            <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${bgColor}`}>
                <div className="mt-1">{icon}</div>
                <div>
                    <h3 className={`font-semibold ${color}`}>{title}</h3>
                    <p className="text-sm text-slate-600">{description}</p>
                </div>
            </div>
        );
    };

    // ===============================
    // 🚀 Render
    // ===============================
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-600">
                {error}
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    Loading session...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold">
                        ShipIQ
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/scan" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Automation Session</h1>
                    <p className="text-slate-600">
                        Managing lifecycle for <span className="font-mono bg-slate-200 px-1 rounded">{session.repoFullName}</span>
                    </p>
                    <div className="text-xs text-slate-400 mt-2 font-mono">ID: {sessionId}</div>
                </header>

                <div className="space-y-4">
                    {/* 1. AI Generation */}
                    <Step
                        title="AI Generation"
                        description="Scanning repository and generating missing infrastructure files via n8n."
                        status={getStepStatus("GENERATING")}
                    />

                    {/* 2. Code Review */}
                    <Step
                        title="Code Review"
                        description={
                            session.generatedFiles && Object.keys(session.generatedFiles).length > 0
                                ? `Generated ${Object.keys(session.generatedFiles).length} files. Review them below.`
                                : "Waiting for files..."
                        }
                        status={getStepStatus("CODE_CREATED")}
                    />

                    {/* Code Preview Block */}
                    {session.generatedFiles && Object.keys(session.generatedFiles).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-slate-900 rounded-xl overflow-hidden shadow-lg my-6"
                        >
                            <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 font-mono border-b border-slate-700">
                                GENERATED FILES
                            </div>
                            <div className="p-4 space-y-4">
                                {Object.entries(session.generatedFiles).map(([path, content]) => (
                                    <div key={path}>
                                        <div className="text-emerald-400 font-mono text-sm mb-1">📄 {path}</div>
                                        <pre className="bg-black/50 p-3 rounded text-slate-300 text-xs font-mono overflow-auto max-h-60">
                                            {content}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}


                    {/* 3. Pull Request */}
                    <Step
                        title="Pull Request"
                        description={
                            session.prUrl
                                ? <a href={session.prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Pull Request #{session.prUrl.split('/').pop()}</a>
                                : session.branchName
                                    ? `Branch '${session.branchName}' created. Creates PR...`
                                    : "Waiting for branch creation..."
                        }
                        status={getStepStatus("PR_OPEN")}
                    />

                    {/* 4. CI/CD Pipeline */}
                    <Step
                        title="CI/CD Pipeline"
                        description="Watching GitHub Actions for build and test results..."
                        status={getStepStatus("CI_RUNNING")}
                    />

                    {/* 5. Completion */}
                    <Step
                        title="Deployment Ready"
                        description="Pipeline finished successfully."
                        status={getStepStatus("COMPLETED")}
                    />
                </div>
            </div>
        </div>
    );
}
