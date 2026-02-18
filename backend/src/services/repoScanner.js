import axios from "axios";
import { getInstallationTokenForRepo } from "./githubAppAuth.js";

/**
 * -------------------------------
 * Utility: Parse GitHub Repo URL
 * -------------------------------
 */
export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== "github.com") return null;

    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
    };
  } catch {
    return null;
  }
}

/**
 * -------------------------------
 * Fetch full repository tree (GitHub App)
 * -------------------------------
 */
async function fetchRepoTree({ owner, repo, branch = "main", installationId }) {
  if (!installationId) {
    throw new Error("installationId required to fetch repo tree");
  }

  const token = await getInstallationTokenForRepo(installationId);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const branchesToTry = [branch, "main", "master"];

  for (const ref of branchesToTry) {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
    const resp = await axios.get(url, {
      headers,
      validateStatus: () => true,
    });

    if (resp.status === 200 && Array.isArray(resp.data?.tree)) {
      return resp.data.tree;
    }
  }

  throw new Error("Failed to fetch repository tree");
}

/**
 * -------------------------------
 * Fetch package.json (GitHub App)
 * -------------------------------
 */
export async function fetchPackageJson({
  owner,
  repo,
  installationId,
  branchCandidates = ["main", "master"],
}) {
  if (!installationId) return null;

  const token = await getInstallationTokenForRepo(installationId);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  for (const ref of branchCandidates) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${ref}`;
    const resp = await axios.get(url, {
      headers,
      validateStatus: () => true,
    });

    if (resp.status === 200) {
      if (typeof resp.data === "string") {
        return JSON.parse(resp.data);
      }
      if (resp.data?.content) {
        return JSON.parse(
          Buffer.from(resp.data.content, "base64").toString("utf8")
        );
      }
    }
  }

  return null;
}

/**
 * -------------------------------
 * Fetch raw file content (GitHub App)
 * -------------------------------
 */
async function fetchRawFile({ owner, repo, path, branch, installationId }) {
  if (!installationId) return null;

  const token = await getInstallationTokenForRepo(installationId);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const resp = await axios.get(url, {
    headers,
    validateStatus: () => true,
  });

  if (resp.status === 200) {
    if (typeof resp.data === "string") return resp.data;
    if (resp.data?.content) {
      return Buffer.from(resp.data.content, "base64").toString("utf8");
    }
  }

  return null;
}

/**
 * -------------------------------
 * Parse env variable names
 * -------------------------------
 */
function parseEnvFile(content) {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => l.split("=")[0].trim());
}

function extractEnvVarsFromCode(content) {
  const matches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
  return Array.from(matches).map((m) => m[1]);
}

/**
 * -------------------------------
 * Main Gap Detector (GitHub App)
 * -------------------------------
 */
export async function gapDetector({
  owner,
  repo,
  branch = "main",
  installationId,
}) {
  const tree = await fetchRepoTree({
    owner,
    repo,
    branch,
    installationId,
  });

  const paths = tree.map((n) => n.path);

  // Detect backend in folder
  const hasBackendFolder = paths.some(
    (p) => p === "backend" || p.startsWith("backend/")
  );

  // Detect backend at repo root (flat Node backend)
  const hasRootBackend =
    paths.includes("package.json") &&
    paths.some((p) =>
      /^(server|index|app|main)\.(js|ts)$/.test(p) ||
      /^src\/(server|index|app|main)\.(js|ts)$/.test(p) ||
      /^bin\/www$/.test(p)
    );

  // Final backend signal
  const hasBackend = hasBackendFolder || hasRootBackend;

  const hasFrontendFolder = paths.some(
    (p) => p === "frontend" || p.startsWith("frontend/")
  );

  const hasRootFrontend =
    paths.includes("package.json") &&
    paths.some((p) =>
      /^(vite|next|webpack)\.config\.(js|ts|mjs|cjs)$/.test(p) ||
      /^src\/(App|index|main)\.(jsx|tsx|js|ts)$/.test(p) ||
      /^public\/index\.html$/.test(p)
    );

  const hasFrontend = hasFrontendFolder || hasRootFrontend;


  const hasAnyDockerfile = paths.some((p) =>
    p.toLowerCase().endsWith("dockerfile")
  );

  const usesGithubActions = paths.some((p) =>
    p.startsWith(".github/workflows/")
  );

  const hasReadme = paths.some((p) => p.toLowerCase() === "readme.md");

  let hasTests = false;
  const pkg = await fetchPackageJson({
    owner,
    repo,
    installationId,
  });

  if (pkg?.scripts?.test) hasTests = true;

  const envVars = new Set();

  const envExamplePath = paths.find((p) =>
    [".env.example", ".env.sample"].includes(p.toLowerCase())
  );

  if (envExamplePath) {
    const content = await fetchRawFile({
      owner,
      repo,
      path: envExamplePath,
      branch,
      installationId,
    });
    if (content) parseEnvFile(content).forEach((v) => envVars.add(v));
  }

  if (envVars.size === 0) {
    const codeFiles = paths.filter(
      (p) =>
        /\.(js|ts|jsx|tsx)$/.test(p) &&
        !p.startsWith("node_modules/")
    );

    for (const file of codeFiles.slice(0, 30)) {
      const content = await fetchRawFile({
        owner,
        repo,
        path: file,
        branch,
        installationId,
      });
      if (content)
        extractEnvVarsFromCode(content).forEach((v) => envVars.add(v));
    }
  }

  if (hasBackend) envVars.add("PORT");

  const gapReport = [];
  if (!hasAnyDockerfile) gapReport.push("missing_dockerfile");
  if (!usesGithubActions) gapReport.push("missing_ci_cd_workflow");
  if (!hasTests) gapReport.push("missing_test_configuration");
  if (!hasReadme) gapReport.push("missing_readme");

  // Detect backend path correctly
  let backendPath = null;
  if (hasBackend) {
    backendPath = hasBackendFolder ? "backend/" : ""; // "" = repo root
  }

  let frontendPath = null;
  if (hasFrontend) {
    frontendPath = hasFrontendFolder ? "frontend/" : "";
  }


  return {
    hasBackend,
    hasFrontend,

    hasBackendFolder,
    hasFrontendFolder,

    backendPath,
    frontendPath,

    backendType: hasBackend ? "node" : null,
    frontendType: hasFrontend ? "react" : null,

    usesDocker: hasAnyDockerfile,
    usesGithubActions,
    hasReadme,
    hasTests,
    gapReport,
    envVars: Array.from(envVars),
  };


}

/**
 * -------------------------------
 * Public API
 * -------------------------------
 */
export async function generateGapReport({ repoUrl, installationId }) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL");
  }

  return gapDetector({
    owner: parsed.owner,
    repo: parsed.repo,
    branch: "main",
    installationId,
  });
}

export default {
  parseGitHubUrl,
  generateGapReport,
  gapDetector,
};
