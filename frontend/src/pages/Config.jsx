
import { useState, useEffect } from "react";
import api from "../api/axios";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";
import { TrashIcon, EyeIcon } from "@heroicons/react/24/outline";

export default function Config() {
    const [secrets, setSecrets] = useState([]);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchSecrets = async () => {
        try {
            const res = await api.get("/api/settings/secrets");
            setSecrets(res.data);
        } catch (err) {
            console.error("Failed to load secrets", err);
        }
    };

    useEffect(() => {
        fetchSecrets();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newKey || !newValue) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await api.post("/api/settings/secrets", {
                key: newKey.toUpperCase().replace(/ /g, "_"),
                value: newValue
            });

            setNewKey("");
            setNewValue("");
            setSuccess("Secret added successfully");
            fetchSecrets();
        } catch (err) {
            setError(err?.response?.data?.error || "Failed to add secret");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (key) => {
        if (!window.confirm(`Delete secret ${key}? This cannot be undone.`)) return;

        try {
            await api.delete(`/api/settings/secrets/${key}`);
            fetchSecrets();
        } catch (err) {
            alert("Failed to delete secret");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b shadow">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <Link to="/scan" className="text-2xl font-bold">
                        ShipIQ
                    </Link>
                    <div className="flex gap-6 text-sm font-medium text-slate-600">
                        <Link to="/scan">Scan</Link>
                        <Link to="/config" className="text-emerald-600">Settings</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto p-6">
                <h2 className="text-3xl font-bold mb-2">Environment Secrets</h2>
                <p className="text-slate-600 mb-8">
                    Securely manage variables for your automation processes.
                    Values are encrypted and stored safely.
                </p>

                {/* Add New Secret */}
                <div className="bg-white rounded-xl p-6 shadow border mb-8">
                    <h3 className="text-lg font-semibold mb-4">Add New Secret</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Key Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. AWS_ACCESS_KEY"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Value</label>
                                <input
                                    type="password"
                                    placeholder="Secret value..."
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        {success && <p className="text-emerald-600 text-sm">{success}</p>}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Encrypting..." : "Save Secret"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* List Secrets */}
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Key</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Value</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {secrets.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                                        No secrets configured yet.
                                    </td>
                                </tr>
                            ) : (
                                secrets.map((secret) => (
                                    <tr key={secret.key} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-sm">{secret.key}</td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-400">
                                            {secret.maskedValue}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(secret.key)}
                                                className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50"
                                                title="Delete Secret"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
