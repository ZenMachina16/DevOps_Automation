import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";
import {
    CheckCircleIcon, XCircleIcon, PlusIcon, TrashIcon, LockClosedIcon,
    ArrowPathIcon, ClockIcon
} from "@heroicons/react/24/outline";

export default function RepoDetails() {
    const { owner, repoName } = useParams();
    const repoFullName = `${owner}/${repoName}`;

    // ===============================
    // State
    // ===============================
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [secrets, setSecrets] = useState([]);
    const [activeSession, setActiveSession] = useState(null);

    // Helper State
    const [scanning, setScanning] = useState(false);

    // Secrets Form
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [addingSecret, setAddingSecret] = useState(false);

    // Generation
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState("");

    // ===============================
    // 1. Initial Data Load
    // ===============================
    useEffect(() => {
        const loadRepoData = async () => {
            try {
                setLoading(true);
                // Use the unified endpoint!
                const res = await api.get(`/api/repo/${owner}/${repoName}`);

                setScanResult(res.data.lastScan);
                setSecrets(res.data.secrets);

                if (res.data.activeSession) {
                    setActiveSession(res.data.activeSession);
                }

            } catch (err) {
                console.error("Failed to load repo details", err);
            } finally {
                setLoading(false);
            }
        };
        loadRepoData();
    }, [repoFullName, owner, repoName]);

    // ===============================
    // 2. Poll Active Session
    // ===============================
    useEffect(() => {
        let interval;
        if (activeSession && ["GENERATING", "CODE_CREATED", "PR_OPEN", "PR_MERGED", "CI_RUNNING"].includes(activeSession.status)) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/api/session/${activeSession.sessionId}`);
                    setActiveSession(res.data);

                    // If finished, refresh scan results to show green checks!
                    if (["COMPLETED", "FAILED"].includes(res.data.status)) {
                        // Reload repo data after short delay to ensure backend updated
                        setTimeout(async () => {
                            const repoRes = await api.get(`/api/repo/${owner}/${repoName}`);
                            setScanResult(repoRes.data.lastScan);
                        }, 2000);
                    }
                } catch (e) {
                    console.error("Polling failed", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [activeSession, owner, repoName]);


    // ===============================
    // Actions
    // ===============================
    const handleManualScan = async () => {
        setScanning(true);
        try {
            const res = await api.post("/api/scan", { repoFullName });
            setScanResult(res.data);
        } catch (err) {
            alert("Scan failed");
        } finally {
            setScanning(false);
        }
    };

    const handleAddSecret = async (e) => {
        e.preventDefault();
        if (!newKey || !newValue) return;
        setAddingSecret(true);

        try {
            await api.post(`/api/repo/${owner}/${repoName}/secrets`, {
                key: newKey,
                value: newValue
            });

            const res = await api.get(`/api/repo/${owner}/${repoName}/secrets`);
            setSecrets(res.data);

            setNewKey("");
            setNewValue("");
        } catch (err) {
            alert("Failed to save secret");
        } finally {
            setAddingSecret(false);
        }
    };

    const handleDeleteSecret = async (key) => {
        if (!confirm(`Delete secret ${key}?`)) return;
        try {
            await api.delete(`/api/repo/${owner}/${repoName}/secrets/${key}`);
            setSecrets(secrets.filter(s => s.key !== key));
        } catch (err) {
            alert("Failed to delete secret");
        }
    };

    const onGenerateFiles = async () => {
        setGenerating(true);
        setGenError("");

        try {
            const res = await api.post("/api/generate-files", {
                repoFullName,
            });

            if (res.data.success) {
                // Automatically switch view via state
                setActiveSession({
                    sessionId: res.data.sessionId,
                    status: "GENERATING",
                    repoFullName
                });
            } else {
                setGenError(res.data.error || "Generation failed");
            }
        } catch {
            setGenError("Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    // ===============================
    // UI Helpers (Session)
    // ===============================
    const getStepStatus = (step) => {
        if (!activeSession) return "waiting";
        const status = activeSession.status;
        const steps = ["GENERATING", "CODE_CREATED", "PR_OPEN", "PR_MERGED", "CI_RUNNING", "COMPLETED"];
        const currentIndex = steps.indexOf(status);
        const stepIndex = steps.indexOf(step);

        if (status === "FAILED") return "error";
        if (stepIndex < currentIndex) return "completed";
        if (stepIndex === currentIndex) return "active";
        return "waiting";
    };

    // ===============================
    // Render
    // ===============================

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Configuration...</div>;
    }

    // Calculate Score
    const trueCount = scanResult ? [scanResult.dockerfile, scanResult.ci, scanResult.readme, scanResult.tests].filter(Boolean).length : 0;
    const score = Math.round((trueCount / 4) * 100);

    // If session is complete/failed, we show it as a "Recent Activity" block but revert to health view
    const showActiveSession = activeSession && !["COMPLETED", "FAILED"].includes(activeSession.status);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Navbar */}
            <nav className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-semibold text-white tracking-tight">ShipIQ</Link>
                    <Link to="/scan" className="text-sm text-slate-400 hover:text-white">Back to Dashboard</Link>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-8">

                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{repoFullName}</h1>
                        <p className="text-slate-400 flex items-center gap-2">
                            Repository Configuration & Health
                            <button onClick={handleManualScan} disabled={scanning} className="text-emerald-500 hover:text-emerald-400" title="Re-scan now">
                                <ArrowPathIcon className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                            </button>
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-bold ${score === 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>{score}%</div>
                        <div className="text-xs text-slate-500 uppercase">Health Score</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* LEFT COL: Health Check OR Active Session */}
                    <div className="md:col-span-2 space-y-8">

                        {showActiveSession ? (
                            // 🔄 ACTIVE SESSION VIEW
                            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                        </span>
                                        Auto-Fix in Progress
                                    </h3>
                                    <span className="text-xs font-mono text-slate-500">{activeSession.sessionId}</span>
                                </div>

                                <div className="space-y-3">
                                    <SessionStep title="AI Generation" status={getStepStatus("GENERATING")} />
                                    <SessionStep title="Code Review" status={getStepStatus("CODE_CREATED")}
                                        info={activeSession.generatedFiles && Object.keys(activeSession.generatedFiles).length > 0 ? `${Object.keys(activeSession.generatedFiles).length} files` : null} />

                                    {/* Code Preview */}
                                    {activeSession.generatedFiles && Object.keys(activeSession.generatedFiles).length > 0 && (
                                        <div className="bg-slate-950 rounded border border-slate-800 p-3 max-h-48 overflow-y-auto">
                                            {Object.entries(activeSession.generatedFiles).map(([k, v]) => (
                                                <div key={k} className="mb-2">
                                                    <div className="text-xs text-emerald-400 font-mono mb-1">{k}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">{v.substring(0, 100)}...</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <SessionStep title="Pull Request" status={getStepStatus("PR_OPEN")}
                                        link={activeSession.prUrl} />
                                    <SessionStep title="CI/CD Pipeline" status={getStepStatus("CI_RUNNING")} />
                                    <SessionStep title="Deployment Ready" status={getStepStatus("COMPLETED")} />
                                </div>
                            </div>
                        ) : (
                            // ✅ STATIC HEALTH CHECK VIEW
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Current Status</h3>

                                {!scanResult && !scanning && (
                                    <div className="text-center py-10 text-slate-500">
                                        No scan data available.
                                        <br />
                                        <button onClick={handleManualScan} className="text-purple-400 underline mt-2">Run Scan</button>
                                    </div>
                                )}

                                {(scanResult || scanning) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Dockerfile', 'CI', 'README', 'Tests'].map((label) => {
                                            const key = label.toLowerCase().replace('ci', 'ci'); // 'ci' stays 'ci'
                                            const val = scanResult ? scanResult[key === 'ci' ? 'ci' : key.toLowerCase()] : false;
                                            return (
                                                <div key={label} className={`p-4 rounded-xl border flex justify-between items-center ${val ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-red-900/10 border-red-900/50'}`}>
                                                    <span className="text-slate-300">{label}</span>
                                                    {val
                                                        ? <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                                                        : <XCircleIcon className="h-6 w-6 text-red-500" />
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-8 border-t border-slate-800 pt-6">
                                    {genError && <p className="text-red-400 text-sm mb-4">{genError}</p>}
                                    <Button
                                        onClick={onGenerateFiles}
                                        disabled={generating || scanning}
                                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-900/20 disabled:opacity-50"
                                    >
                                        {generating ? "Starting AI Agent..." : "✨ Auto-Fix Missing Components"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: Secrets Vault */}
                    <div className="md:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <LockClosedIcon className="h-5 w-5 text-yellow-500" />
                                <h3 className="text-lg font-semibold text-white">Secrets Vault</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-6">Environment variables for this repository.</p>

                            {/* List Secrets */}
                            <div className="space-y-3 mb-6">
                                {secrets.length === 0 && <p className="text-sm text-slate-600 italic">No secrets configured.</p>}
                                {secrets.map(s => (
                                    <div key={s.key} className="flex justify-between items-center bg-slate-950/50 p-3 rounded border border-slate-800">
                                        <span className="font-mono text-xs text-yellow-400">{s.key}</span>
                                        <button onClick={() => handleDeleteSecret(s.key)} className="text-slate-600 hover:text-red-400">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Secret Form */}
                            <form onSubmit={handleAddSecret} className="space-y-3 border-t border-slate-800 pt-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="KEY (e.g. DB_URL)"
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                        value={newKey}
                                        onChange={e => setNewKey(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        placeholder="VALUE"
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                    />
                                </div>
                                <Button
                                    disabled={addingSecret || !newKey || !newValue}
                                    className="w-full text-xs"
                                >
                                    <PlusIcon className="h-3 w-3 inline mr-1" /> Add Secret
                                </Button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Sub-component for Session Steps
function SessionStep({ title, status, link, info }) {
    let icon = <div className="h-4 w-4 rounded-full bg-slate-700 border border-slate-600" />;
    let color = "text-slate-500";
    let bg = "bg-slate-900/50";

    if (status === "completed") {
        icon = <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
        color = "text-emerald-400";
        bg = "bg-emerald-900/10 border-emerald-900/30";
    } else if (status === "active") {
        icon = <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
        color = "text-blue-400";
        bg = "bg-blue-900/10 border-blue-900/30";
    } else if (status === "error") {
        icon = <XCircleIcon className="h-5 w-5 text-red-500" />;
        color = "text-red-400";
        bg = "bg-red-900/10 border-red-900/30";
    }

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border border-transparent ${bg}`}>
            <div className="flex items-center gap-3">
                {icon}
                <span className={`font-medium ${color}`}>{title}</span>
            </div>
            {link && <a href={link} target="_blank" className="text-xs underline text-blue-400">View</a>}
            {info && <span className="text-xs text-slate-500">{info}</span>}
        </div>
    );
}
