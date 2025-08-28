import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button.jsx';

export default function Scan() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/octocat/Hello-World');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const renderStatus = (value) => (value ? '✅' : '❌');

  const onScan = async (e) => {
    e.preventDefault();
    setResult(null);
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/scan', { repoUrl });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                ShipIQ
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link to="/scan" className="text-emerald-600 font-medium">
                Scan
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 animate-fadeIn">
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Repository Scan</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Analyze your GitHub repository for DevOps best practices</p>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all duration-200">
          <form onSubmit={onScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">GitHub Repository URL</label>
              <input
                type="url"
                className="mt-1 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? 'Scanning…' : 'Scan'}
            </Button>
            </form>
          </div>

          {loading && (
            <div className="mt-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></span>
                  Analyzing repository…
                </div>
              </motion.div>
            </div>
          )}

          {result && !loading && (
            <div className="mt-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all duration-200">
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Results</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-slate-200 dark:border-slate-600 text-sm rounded-lg">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="border border-slate-200 dark:border-slate-600 px-4 py-3 text-left text-slate-900 dark:text-white font-medium">Item</th>
                        <th className="border border-slate-200 dark:border-slate-600 px-4 py-3 text-left text-slate-900 dark:text-white font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800">
                      <tr>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Dockerfile</td>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3">{renderStatus(result.dockerfile)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">CI/CD pipeline</td>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3">{renderStatus(result.ci)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">README</td>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3">{renderStatus(result.readme)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Tests</td>
                        <td className="border border-slate-200 dark:border-slate-600 px-4 py-3">{renderStatus(result.tests)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


