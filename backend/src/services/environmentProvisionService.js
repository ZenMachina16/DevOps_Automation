import axios from "axios";
import _sodium from "libsodium-wrappers";
import { getInstallationTokenForRepo } from "./githubAppAuth.js";

/**
 * -------------------------------------------------
 * Sync Secret to Repository (NOT environment)
 * -------------------------------------------------
 */
export async function syncRepoSecret(
  installationId,
  owner,
  repo,
  secretName,
  secretValue
) {
  await _sodium.ready;
  const sodium = _sodium;

  const token = await getInstallationTokenForRepo(installationId);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // 1️⃣ Get repository public key
  const { data } = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
    { headers }
  );

  const keyId = data.key_id;
  const key = data.key;

  // 2️⃣ Encrypt secret
  const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secretValue);

  const encBytes = sodium.crypto_box_seal(binsec, binkey);

  const encryptedValue = sodium.to_base64(
    encBytes,
    sodium.base64_variants.ORIGINAL
  );

  // 3️⃣ Upload secret to repository
  await axios.put(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
    {
      encrypted_value: encryptedValue,
      key_id: keyId,
    },
    { headers }
  );

  console.log(
    `🔐 Synced repository secret '${secretName}' for ${owner}/${repo}`
  );
}

/**
 * -------------------------------------------------
 * Provision Repository Secrets
 * -------------------------------------------------
 */
export async function provisionRepoSecrets({
  installationId,
  owner,
  repo,
  secrets = [],
}) {
  try {
    console.log(
      `🚀 Starting repository secret provisioning for ${owner}/${repo}`
    );

    for (const secret of secrets) {
      if (!secret.key || !secret.value) continue;

      await syncRepoSecret(
        installationId,
        owner,
        repo,
        secret.key,
        secret.value
      );
    }

    console.log(
      `🎉 Repository secrets provisioned successfully`
    );

    return {
      success: true,
      secretsSynced: secrets.length,
    };
  } catch (error) {
    console.error(
      "❌ Repo secret provisioning failed:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.message ||
        "Repository secret provisioning failed"
    );
  }
}