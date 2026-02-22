import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { provisionRepoSecrets } from "./environmentProvisionService.js";

/**
 * Save or update a repository secret in Mongo (encrypted)
 */
export async function saveRepositorySecret({
  fullName,
  installationId,
  key,
  value,
}) {
  if (!key || !value) {
    throw new Error("Secret key and value required");
  }

  const { encryptedValue, iv } = encrypt(value);

  const repo = await RepositoryConfig.findOneAndUpdate(
    { fullName },
    {
      $setOnInsert: {
        fullName,
        installationId,
      },
      $pull: { secrets: { key } }, // remove old if exists
    },
    { upsert: true, new: true }
  );

  repo.secrets.push({
    key,
    encryptedValue,
    iv,
    updatedAt: new Date(),
  });

  await repo.save();

  return { success: true };
}

/**
 * Get decrypted secrets for provisioning
 */
export async function getDecryptedSecrets(fullName) {
  const repo = await RepositoryConfig.findOne({ fullName });

  if (!repo || !repo.secrets.length) {
    return [];
  }

  return repo.secrets.map((secret) => ({
    key: secret.key,
    value: decrypt(secret.encryptedValue, secret.iv),
  }));
}

/**
 * Push all stored Mongo secrets to GitHub repo
 */
export async function syncMongoSecretsToGitHub({
  fullName,
  installationId,
}) {
  const [owner, repo] = fullName.split("/");

  const secrets = await getDecryptedSecrets(fullName);

  if (!secrets.length) {
    return { success: false, message: "No secrets stored" };
  }

  return await provisionRepoSecrets({
    installationId,
    owner,
    repo,
    secrets,
  });
}