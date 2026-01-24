import { GitHubInstallation } from "../models/GitHubInstallation.js";

/**
 * =====================================
 * Get installation by ID
 * =====================================
 */
export async function getInstallation(installationId) {
  return GitHubInstallation.findOne({ installationId });
}

/**
 * =====================================
 * Create or update installation
 * =====================================
 */
export async function upsertInstallation(data) {
  return GitHubInstallation.findOneAndUpdate(
    { installationId: data.installationId },
    { $set: data },
    { upsert: true, new: true }
  );
}

/**
 * =====================================
 * Update repositories list
 * =====================================
 */
export async function updateInstallationRepos(installationId, repositories) {
  return GitHubInstallation.findOneAndUpdate(
    { installationId },
    { repositories },
    { new: true }
  );
}
