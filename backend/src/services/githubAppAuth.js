// backend/src/services/githubAppAuth.js

import fs from "fs";
import jwt from "jsonwebtoken";
import axios from "axios";

const GITHUB_API = "https://api.github.com";

/**
 * Load private key once
 */
const privateKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
if (!privateKeyPath) {
  throw new Error("GITHUB_APP_PRIVATE_KEY_PATH not set");
}

const privateKey = fs.readFileSync(privateKeyPath, "utf8");

/**
 * Create GitHub App JWT (valid for 10 minutes)
 */
export function createAppJWT() {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error("GITHUB_APP_ID not set");
  }

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

/**
 * Get installation access token
 */
export async function getInstallationToken(installationId) {
  const jwtToken = createAppJWT();

  const response = await axios.post(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  return response.data.token;
}

/**
 * GitHub API headers using installation token
 */
export function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json"
  };
}
