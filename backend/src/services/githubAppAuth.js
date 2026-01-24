import jwt from "jsonwebtoken";
import fs from "fs";
import axios from "axios";

/**
 * =====================================
 * Create GitHub App JWT (App → GitHub)
 * =====================================
 */
export function createAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const keyPath = process.env.GITHUB_PRIVATE_KEY_PATH;

  if (!appId || !keyPath) {
    console.error("❌ ENV AT JWT CREATION TIME:", {
      GITHUB_APP_ID: appId,
      GITHUB_APP_PRIVATE_KEY_PATH: keyPath,
    });
    throw new Error("GitHub App credentials missing");
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(`GitHub App private key not found at: ${keyPath}`);
  }

  const privateKey = fs.readFileSync(keyPath, "utf8");
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

/**
 * =====================================
 * Fetch installation details
 * =====================================
 */
export async function getInstallationDetails(installationId) {
  const jwtToken = createAppJwt();

  const res = await axios.get(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return res.data;
}

/**
 * =====================================
 * Create installation access token
 * =====================================
 */
export async function createInstallationToken(installationId) {
  const jwtToken = createAppJwt();

  const res = await axios.post(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  return res.data.token;
}

/**
 * =====================================
 * 🔑 REQUIRED BY repoScanner.js
 * Alias for installation token
 * =====================================
 */
export async function getInstallationTokenForRepo(installationId) {
  return createInstallationToken(installationId);
}

/**
 * =====================================
 * Fetch repositories for installation
 * =====================================
 */
export async function fetchInstallationRepos(installationId) {
  const installationToken = await createInstallationToken(installationId);

  const res = await axios.get(
    "https://api.github.com/installation/repositories",
    {
      headers: {
        Authorization: `Bearer ${installationToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  return res.data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
  }));
}
