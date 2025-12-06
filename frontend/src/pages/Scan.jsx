import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button.jsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import CodeCanvas from '../components/CodeCanvas.jsx';

export default function Scan() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [result, setResult] = useState(null);
  const [generatedFiles, setGeneratedFiles] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef({ timerId: null, attempts: 0, maxAttempts: 12 });

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
    } catch (_err) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text || '';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (_e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current.timerId) {
        clearInterval(pollRef.current.timerId);
        pollRef.current.timerId = null;
      }
    };
  }, []);

  const maybeStartPolling = (repoMeta, branch) => {
    if (!repoMeta?.owner || !repoMeta?.name || !branch) return;
    if (pollRef.current.timerId) return; // already polling
    pollRef.current.attempts = 0;
    pollRef.current.timerId = setInterval(async () => {
      try {
        pollRef.current.attempts += 1;
        const filesRes = await api.get('/repo/generated-files', {
          params: { owner: repoMeta.owner, repo: repoMeta.name, branch }
        });
        const fetched = filesRes.data?.files || [];
        if (Array.isArray(fetched) && fetched.length > 0) {
          setGeneratedFiles((prev) => {
            const mergedByPath = new Map((prev?.items || []).map(i => [i.path, i.content]));
            for (const f of fetched) mergedByPath.set(f.path, f.content);
            const items = ['Dockerfile', '.github/workflows/main.yml', 'README.md'].map(p => ({ path: p, content: mergedByPath.get(p) || '' }));
            return {
              ...(prev || {}),
              repo: prev?.repo || { owner: repoMeta.owner, name: repoMeta.name },
              branch: branch,
              items,
              timestamp: new Date().toISOString(),
            };
          });
        }
        const allPresent = ['Dockerfile', '.github/workflows/main.yml', 'README.md']
          .every(p => fetched.some(f => f.path === p) || (generatedFiles?.items || []).some(i => i.path === p && i.content));
        if (allPresent || pollRef.current.attempts >= pollRef.current.maxAttempts) {
          clearInterval(pollRef.current.timerId);
          pollRef.current.timerId = null;
        }
      } catch (_err) {
        // keep polling until maxAttempts
        if (pollRef.current.attempts >= pollRef.current.maxAttempts) {
          clearInterval(pollRef.current.timerId);
          pollRef.current.timerId = null;
        }
      }
    }, 10000); // poll every 10s
  };

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

  // Extract repo owner/name and branch from flexible response shapes or fallback to selected repo URL
  const extractRepoAndBranch = (resData, selectedRepoData) => {
    const out = {
      repo: { owner: null, name: null },
      branch: null,
      url: null,
    };
    const data = resData || {};
    const repoNode = data.repository || data.repo || {};
    out.url = data.url || repoNode.url || selectedRepoData?.url || null;
    out.repo.owner = repoNode.owner || data.owner || data.user || data.org || null;
    out.repo.name = repoNode.name || repoNode.repo || data.name || data.repo || null;
    out.branch = data.branch || data.branchName || data.ref || (data.n8n ? data.n8n.branch : null) || null;
    // Derive owner/name from URL if missing
    if ((!out.repo.owner || !out.repo.name) && out.url) {
      try {
        const m = out.url.match(/github\.com\/([^\/]+)\/([^\/#?]+)/i);
        if (m) {
          out.repo.owner = out.repo.owner || m[1];
          out.repo.name = out.repo.name || m[2];
        }
      } catch (_e) {}
    }
    // As a last resort, parse from stringified payload
    try {
      const raw = JSON.stringify(data);
      if (!out.repo.owner) {
        const mo = raw.match(/"owner"\s*:\s*"([^"]+)"/i);
        if (mo) out.repo.owner = mo[1];
      }
      if (!out.repo.name) {
        const mn = raw.match(/"(?:name|repo)"\s*:\s*"([^"]+)"/i);
        if (mn) out.repo.name = mn[1];
      }
      if (!out.url) {
        const mu = raw.match(/"url"\s*:\s*"(https:\/\/github\.com\/[^"]+)"/i);
        if (mu) out.url = mu[1];
      }
      if (!out.branch) {
        const mb = raw.match(/"branch"\s*:\s*"([^"]+)"/i) || raw.match(/n8n[^"']*["']([^"']+)["']/i);
        if (mb) out.branch = mb[1];
      }
      if ((!out.repo.owner || !out.repo.name) && out.url) {
        const m2 = out.url.match(/github\.com\/([^\/]+)\/([^\/#?]+)/i);
        if (m2) {
          out.repo.owner = out.repo.owner || m2[1];
          out.repo.name = out.repo.name || m2[2];
        }
      }
    } catch (_e) {}
    return out;
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
    setGeneratedFiles(null);
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

  const onGenerateFiles = async () => {
    if (!selectedRepo) {
      setError('Please select a repository first');
      return;
    }
    
    setGeneratedFiles(null);
    setError('');
    setGenerating(true);
    
    try {
      const selectedRepoData = repositories.find(r => r.fullName === selectedRepo);
      const res = await api.post('/generate-files', { repoUrl: selectedRepoData.url });
      const meta = extractRepoAndBranch(res.data, selectedRepoData);

      if (res.data?.success) {
        const repoMeta = meta.repo?.owner && meta.repo?.name ? { owner: meta.repo.owner, name: meta.repo.name } : null;
        const branch = meta.branch;
        // Always fetch all three known files after generation
        if (repoMeta?.owner && repoMeta?.name && branch) {
          const filesRes = await api.get('/repo/generated-files', {
            params: { owner: repoMeta.owner, repo: repoMeta.name, branch }
          });
          setGeneratedFiles({
            repo: repoMeta,
            branch,
            items: filesRes.data?.files || [],
            timestamp: res.data.timestamp || new Date().toISOString(),
          });
          // begin polling for late-arriving files
          const hasAll = ['Dockerfile', '.github/workflows/main.yml', 'README.md']
            .every(p => (filesRes.data?.files || []).some(f => f.path === p));
          if (!hasAll) {
            maybeStartPolling(repoMeta, branch);
          }
        } else if (res.data.generatedFiles) {
          // fallback for inline content
          setGeneratedFiles({
            repo: repoMeta || (meta.repo?.owner && meta.repo?.name ? { owner: meta.repo.owner, name: meta.repo.name } : null),
            branch: branch || null,
            items: [{ path: res.data.generatedFiles.fileType || 'file', content: res.data.generatedFiles.content || '' }],
            timestamp: res.data.generatedFiles.timestamp || new Date().toISOString(),
          });
          if (meta.repo?.owner && meta.repo?.name && branch) {
            maybeStartPolling({ owner: meta.repo.owner, name: meta.repo.name }, branch);
          }
        } else {
          // Even if files not returned yet, if we have meta/branch show CTA and start polling
          if (meta.repo?.owner && meta.repo?.name && meta.branch) {
            setGeneratedFiles({
              repo: { owner: meta.repo.owner, name: meta.repo.name },
              branch: meta.branch,
              items: [],
              timestamp: res.data.timestamp || new Date().toISOString(),
            });
            maybeStartPolling({ owner: meta.repo.owner, name: meta.repo.name }, meta.branch);
          } else {
            setError('Generation succeeded but missing repository/branch info.');
          }
        }
      } else {
        setError(res.data?.error || 'File generation failed');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'File generation failed');
      console.error('Generation error:', err);
    } finally {
      setGenerating(false);
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

      <div className="max-w-6xl mx-auto p-4 animate-fadeIn">
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
                
                {/* Generate Files Button */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Missing some DevOps files? Let our AI generate them for you!
                  </p>
                  <Button 
                    onClick={onGenerateFiles}
                    disabled={generating}
                    variant="secondary"
                    className="w-full"
                  >
                    {generating ? 'Generating Files with AI...' : ' Generate Missing Files'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* AI Generation Loading */}
          {generating && (
            <div className="mt-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></span>
                  AI is generating your missing DevOps files... This may take 30-60 seconds.
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Our AI is analyzing your repository and creating optimized configurations.
                </div>
              </motion.div>
            </div>
          )}

          {/* Generated Files Display */}
          {generatedFiles && !generating && (
            <div className="mt-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl"></span>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Generated files @ {generatedFiles.branch}
                  </h3>
                </div>
                {(() => {
                  const desired = ['Dockerfile', '.github/workflows/main.yml', 'README.md'];
                  const byPath = Object.fromEntries((generatedFiles.items || []).map((i) => [i.path, i.content]));
                  return desired.map((p, idx) => {
                    const content = byPath[p];
                    return (
                      <div key={`${p}-${idx}`} className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {p} • Generated at {new Date(generatedFiles.timestamp).toLocaleTimeString()}
                          </span>
                          {content ? (
                            <button
                              onClick={() => copyText(content)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Copy
                            </button>
                          ) : null}
                        </div>
                        {content ? (
                          <CodeCanvas content={content} path={p} />
                        ) : (
                          <div className="text-slate-500 text-sm px-2 py-3">Not found in branch.</div>
                        )}
                      </div>
                    );
                  });
                })()}
                
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <strong>Tip:</strong> Review and commit from your branch PR if needed.
                  </p>
                </div>
                
                {generatedFiles?.repo?.owner && generatedFiles?.repo?.name && generatedFiles?.branch ? (
                  <div className="mt-4 flex justify-end">
                    <a
                      href={`https://github.com/${generatedFiles.repo.owner}/${generatedFiles.repo.name}/tree/${encodeURIComponent(generatedFiles.branch)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                    >
                      View Branch in GitHub
                    </a>
                  </div>
                ) : null}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


