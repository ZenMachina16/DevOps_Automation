import axios from 'axios';

export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');
    return { owner, repo };
  } catch (_err) {
    return null;
  }
}

async function fetchRepoTree({ owner, repo, branch = 'main' }) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const candidates = [branch, 'master', 'main'];
  let lastError = null;
  for (const ref of candidates) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
      const resp = await axios.get(url, { headers, validateStatus: () => true });
      if (resp.status === 200 && resp.data && Array.isArray(resp.data.tree)) {
        return resp.data.tree;
      }
      lastError = new Error(`GitHub API ${resp.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Failed to fetch repository tree');
}

async function fetchPackageJson({ owner, repo, branchCandidates = ['main', 'master'] }) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.raw+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (const ref of branchCandidates) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${encodeURIComponent(ref)}`;
      const resp = await axios.get(url, { headers, validateStatus: () => true });
      if (resp.status === 200 && resp.data) {
        if (typeof resp.data === 'string') {
          return JSON.parse(resp.data);
        }
        if (resp.data.content) {
          const decoded = Buffer.from(resp.data.content, 'base64').toString('utf8');
          return JSON.parse(decoded);
        }
        if (resp.headers['content-type']?.includes('application/json')) {
          return resp.data;
        }
      }
    } catch (_err) {
      // continue to next ref
    }
  }
  return null;
}

export async function generateGapReport(repoUrl) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  return gapDetector(parsed.owner, parsed.repo, 'main');
}

export async function gapDetector(owner, repo, branch = 'main') {
  const tree = await fetchRepoTree({ owner, repo, branch });
  const paths = new Set(tree.map((node) => node.path));

  // Root-level checks must be exact matches at root (case-insensitive for Dockerfile/README)
  const hasRootDockerfile = Array.from(paths).some((p) => p.toLowerCase() === 'dockerfile');
  const hasCI = Array.from(paths).some((p) => p.startsWith('.github/workflows/') && p.length > '.github/workflows/'.length);
  const hasRootReadme = Array.from(paths).some((p) => p.toLowerCase() === 'readme.md');

  let hasTests = false;
  const pkg = await fetchPackageJson({ owner, repo, branchCandidates: [branch, 'master', 'main'] });
  if (pkg && pkg.scripts && typeof pkg.scripts.test === 'string' && pkg.scripts.test.trim().length > 0) {
    hasTests = true;
  }

  return { dockerfile: hasRootDockerfile, ci: hasCI, readme: hasRootReadme, tests: hasTests };
}

export default { generateGapReport, gapDetector, parseGitHubUrl };


