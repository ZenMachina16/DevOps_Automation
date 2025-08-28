import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button.jsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Scan() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const renderStatus = (value) => (value ? '✅' : '❌');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await api.get('/auth/user');
        setUser(response.data);
        await fetchRepositories();
      } catch (err) {
        console.log('User not authenticated:', err.message);
        setUser(null);
      }
    };

    checkUser();
  }, [searchParams]);

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    try {
      const response = await api.get('/auth/repos');
      setRepositories(response.data);
    } catch (err) {
      setError('Failed to fetch repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setRepositories([]);
      setSelectedRepo('');
      setResult(null);
      setError('');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const onScan = async (e) => {
    e.preventDefault();
    if (!selectedRepo) {
      setError('Please select a repository to scan');
      return;
    }
    setResult(null);
    setError('');
    setLoading(true);
    try {
      const selectedRepoData = repositories.find(r => r.fullName === selectedRepo);
      const res = await api.post('/scan', { repoUrl: selectedRepoData.url });
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
              {user && (
                <div className="flex items-center gap-4">
                  <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                  <span className="text-slate-600 dark:text-slate-300">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 animate-fadeIn">
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Repository Scan</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Analyze your GitHub repository for DevOps best practices</p>
          
          {user && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all duration-200">
              <div className="flex items-center gap-3 mb-6">
                <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{user.name || user.username}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">@{user.username}</p>
                </div>
              </div>
              
              <form onSubmit={onScan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Repository
                  </label>
                  {loadingRepos ? (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></span>
                      Loading repositories...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                      >
                        <option value="">Choose a repository...</option>
                        {repositories.map((repo) => (
                          <option key={repo.id} value={repo.fullName}>
                            {repo.fullName} {repo.private ? '(Private)' : '(Public)'}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button disabled={loading || !selectedRepo} type="submit" className="w-full">
                  {loading ? 'Scanning Repository…' : 'Scan Repository'}
                </Button>
              </form>
            </div>
          )}

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


