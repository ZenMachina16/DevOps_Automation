import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";
import {
    CheckCircleIcon, XCircleIcon, PlusIcon, TrashIcon, LockClosedIcon
} from "@heroicons/react/24/outline";

export default function RepoDetails() {
    const { owner, repoName } = useParams();
    const repoFullName = `${owner}/${repoName}`;
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [secrets, setSecrets] = useState([]);

    // Secrets Form
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [addingSecret, setAddingSecret] = useState(false);

    // Generation
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState("");

    // ===============================
    // Fetch Data
    // ===============================
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // 1. Run a fresh scan (or fetch last scan if we stored it)
                const scanRes = await api.post("/api/scan", { repoFullName });
                setScanResult(scanRes.data);

                // 2. Fetch Secrets
                const secretsRes = await api.get(`/api/repo/${owner}/${repoName}/secrets`);
                setSecrets(secretsRes.data);

            } catch (err) {
                console.error("Failed to load repo details", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [repoFullName, owner, repoName]);

    // ===============================
    // Actions
    // ===============================
    const handleAddSecret = async (e) => {
        e.preventDefault();
        if (!newKey || !newValue) return;
        setAddingSecret(true);

        try {
            await api.post(`/api/repo/${owner}/${repoName}/secrets`, {
                key: newKey,
                value: newValue
            });

            // Refresh list
            const res = await api.get(`/api/repo/${owner}/${repoName}/secrets`);
            setSecrets(res.data);

            // Reset form
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
                navigate(`/session/${res.data.sessionId}`);
            } else {
                setGenError(res.data.error || "Generation failed");
                setGenerating(false);
            }
        } catch {
            setGenError("Generation failed");
            setGenerating(false);
        }
    };

    // ===============================
    // Helpers
    // ===============================
    const calculateScore = (result) => {
        if (!result) return 0;
        const trueCount = [result.dockerfile, result.ci, result.readme, result.tests].filter(Boolean).length;
        return Math.round((trueCount / 4) * 100);
    };

    const checks = scanResult ? [
        { label: "Dockerfile", value: scanResult.dockerfile },
        { label: "CI/CD", value: scanResult.ci },
        { label: "README", value: scanResult.readme },
        { label: "Tests", value: scanResult.tests },
    ] : [];

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Repository...</div>;
    }

    const score = calculateScore(scanResult);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Navbar */}
            <nav className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-semibold text-white tracking-tight">ShipIQ</Link>
                    <Link to="/scan" className="text-sm text-slate-400 hover:text-white">Back to Dashboard</Link>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto p-8">

                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{repoFullName}</h1>
                        <p className="text-slate-400">Repository Configuration & Health</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-emerald-400">{score}%</div>
                        <div className="text-xs text-slate-500 uppercase">Health Score</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* LEFT COL: Health Check */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Health Status</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {checks.map((check) => (
                                    <div key={check.label} className={`p-4 rounded-xl border flex justify-between items-center ${check.value ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-red-900/10 border-red-900/50'}`}>
                                        <span className="text-slate-300">{check.label}</span>
                                        {check.value
                                            ? <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                                            : <XCircleIcon className="h-6 w-6 text-red-500" />
                                        }
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 border-t border-slate-800 pt-6">
                                {genError && <p className="text-red-400 text-sm mb-4">{genError}</p>}
                                <Button
                                    onClick={onGenerateFiles}
                                    disabled={generating}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-900/20"
                                >
                                    {generating ? "Starting AI Agent..." : "✨ Auto-Fix & Generate Files"}
                                </Button>
                                <p className="text-xs text-center text-slate-500 mt-2">
                                    This will trigger n8n using the secrets defined below.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Secrets Vault */}
                    <div className="md:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <LockClosedIcon className="h-5 w-5 text-yellow-500" />
                                <h3 className="text-lg font-semibold text-white">Secrets Vault</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-6">Environment variables for this repository (e.g. API Keys, DB URLs).</p>

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
