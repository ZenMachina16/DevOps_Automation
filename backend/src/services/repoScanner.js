import axios from 'axios';

/**
 * -------------------------------
 * Utility: Parse GitHub Repo URL
 * -------------------------------
 */
export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== 'github.com') return null;

    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ''),
    };
  } catch {
    return null;
  }
}

/**
 * -------------------------------
 * Fetch full repository tree
 * -------------------------------
 */
async function fetchRepoTree({ owner, repo, branch = 'main' }) {
  const token = process.env.GITHUB_TOKEN;

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const branchesToTry = [branch, 'main', 'master'];

  for (const ref of branchesToTry) {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
    const resp = await axios.get(url, { headers, validateStatus: () => true });

    if (resp.status === 200 && Array.isArray(resp.data?.tree)) {
      return resp.data.tree;
    }
  }

  throw new Error('Failed to fetch repository tree');
}

/**
 * -------------------------------
 * Fetch package.json (if exists)
 * -------------------------------
 */
export async function fetchPackageJson({ owner, repo, branchCandidates = ['main', 'master'] }) {
  const token = process.env.GITHUB_TOKEN;

  const headers = {
    Accept: 'application/vnd.github.raw+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  for (const ref of branchCandidates) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${ref}`;
    const resp = await axios.get(url, { headers, validateStatus: () => true });

    if (resp.status === 200) {
      if (typeof resp.data === 'string') {
        return JSON.parse(resp.data);
      }
      if (resp.data?.content) {
        return JSON.parse(Buffer.from(resp.data.content, 'base64').toString('utf8'));
      }
    }
  }

  return null;
}

/**
 * -------------------------------
 * Fetch raw file content
 * -------------------------------
 */
async function fetchRawFile({ owner, repo, path, branch }) {
  const token = process.env.GITHUB_TOKEN;

  const headers = {
    Accept: 'application/vnd.github.raw+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const resp = await axios.get(url, { headers, validateStatus: () => true });

  if (resp.status === 200) {
    if (typeof resp.data === 'string') return resp.data;
    if (resp.data?.content) {
      return Buffer.from(resp.data.content, 'base64').toString('utf8');
    }
  }

  return null;
}

/**
 * -------------------------------
 * Parse env variable names from env file
 * -------------------------------
 */
function parseEnvFile(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => line.split('=')[0].trim());
}

/**
 * -------------------------------
 * Extract env vars from JS/TS code
 * -------------------------------
 */
function extractEnvVarsFromCode(content) {
  const matches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
  return Array.from(matches).map(m => m[1]);
}

/**
 * -------------------------------
 * Main Gap Detector (ENHANCED)
 * -------------------------------
 */
export async function gapDetector(owner, repo, branch = 'main') {
  const tree = await fetchRepoTree({ owner, repo, branch });
  const paths = tree.map(node => node.path);

  /* -------------------------------
     STRUCTURE DETECTION
  -------------------------------- */
  const hasBackend = paths.some(p => p.startsWith('backend/'));
  const hasFrontend = paths.some(p => p.startsWith('frontend/'));

  /* -------------------------------
     DOCKER DETECTION
  -------------------------------- */
  const hasAnyDockerfile = paths.some(p =>
    p.toLowerCase().endsWith('dockerfile')
  );

  /* -------------------------------
     CI DETECTION
  -------------------------------- */
  const usesGithubActions = paths.some(
    p => p.startsWith('.github/workflows/')
  );

  /* -------------------------------
     README DETECTION
  -------------------------------- */
  const hasReadme = paths.some(
    p => p.toLowerCase() === 'readme.md'
  );

  /* -------------------------------
     TEST DETECTION
  -------------------------------- */
  let hasTests = false;
  const pkg = await fetchPackageJson({ owner, repo, branchCandidates: [branch, 'main', 'master'] });

  if (pkg?.scripts?.test && pkg.scripts.test.trim().length > 0) {
    hasTests = true;
  }

  /* -------------------------------
     TECHNOLOGY INFERENCE
  -------------------------------- */
  const backendType = hasBackend ? 'node' : null;
  const frontendType = hasFrontend ? 'react' : null;

  /* -------------------------------
     ENV VARIABLE DETECTION
  -------------------------------- */
  const envVars = new Set();

  // 1️⃣ Explicit env files
  const envExamplePath = paths.find(p =>
    ['.env.example', '.env.sample'].includes(p.toLowerCase())
  );

  if (envExamplePath) {
    const envContent = await fetchRawFile({
      owner,
      repo,
      path: envExamplePath,
      branch,
    });

    if (envContent) {
      parseEnvFile(envContent).forEach(v => envVars.add(v));
    }
  }

  // 2️⃣ Fallback: scan code for process.env.X
  if (envVars.size === 0) {
    const codeFiles = paths.filter(p =>
      /\.(js|ts|jsx|tsx)$/.test(p) &&
      !p.startsWith('node_modules/') &&
      !p.startsWith('dist/') &&
      !p.startsWith('build/')
    );

    for (const file of codeFiles.slice(0, 30)) {
      const content = await fetchRawFile({
        owner,
        repo,
        path: file,
        branch,
      });

      if (content) {
        extractEnvVarsFromCode(content).forEach(v => envVars.add(v));
      }
    }
  }

  // 3️⃣ Light inference
  if (hasBackend) {
    envVars.add('PORT');
  }

  /* -------------------------------
     GAP REPORT (RULE ENGINE INPUT)
  -------------------------------- */
  const gapReport = [];

  if (!hasAnyDockerfile) gapReport.push('missing_dockerfile');
  if (!usesGithubActions) gapReport.push('missing_ci_cd_workflow');
  if (!hasTests) gapReport.push('missing_test_configuration');
  if (!hasReadme) gapReport.push('missing_readme');

  /* -------------------------------
     FINAL SCAN RESULT
  -------------------------------- */
  return {
    // Project structure
    hasBackend,
    hasFrontend,
    backendPath: hasBackend ? 'backend/' : null,
    frontendPath: hasFrontend ? 'frontend/' : null,

    // Tech stack
    backendType,
    frontendType,

    // DevOps status
    usesDocker: hasAnyDockerfile,
    usesGithubActions,
    hasReadme,
    hasTests,

    // Raw gaps for rule engine
    gapReport,

    // 👇 NEW
    envVars: Array.from(envVars),
  };
}

/**
 * -------------------------------
 * Public API
 * -------------------------------
 */
export async function generateGapReport(repoUrl) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  return gapDetector(parsed.owner, parsed.repo, 'main');
}

export default {
  parseGitHubUrl,
  generateGapReport,
  gapDetector,
};
