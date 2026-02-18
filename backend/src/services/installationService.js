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
// ... existing exports ...

/**
 * =====================================
 * Update repositories list (Set)
 * =====================================
 */
export async function updateInstallationRepos(installationId, repositories) {
  return GitHubInstallation.findOneAndUpdate(
    { installationId },
    { repositories },
    { new: true }
  );
}

/**
 * =====================================
 * Add repositories (Atomic)
 * =====================================
 */
export async function addRepositories(installationId, reposToAdd) {
  return GitHubInstallation.findOneAndUpdate(
    { installationId },
    { $addToSet: { repositories: { $each: reposToAdd } } },
    { new: true }
  );
}

/**
 * =====================================
 * Remove repositories (Atomic)
 * =====================================
 */
export async function removeRepositories(installationId, reposToRemove) {
  return GitHubInstallation.findOneAndUpdate(
    { installationId },
    { $pull: { repositories: { $in: reposToRemove } } },
    { new: true }
  );
}

