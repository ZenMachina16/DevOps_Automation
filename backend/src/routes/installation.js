import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { fetchInstallationRepos } from "../services/githubAppAuth.js";
import { updateInstallationRepos } from "../services/installationService.js";

const router = Router();

/**
 * =====================================
 * ▶ Get repositories (from Mongo)
 * Used by Scan.jsx
 * =====================================
 */
router.get("/repos", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const username =
    req.user.profile?.username ||
    req.user.profile?.login;

  const installation = await GitHubInstallation.findOne({
    accountLogin: username,
    suspended: false,
  });

  if (!installation) {
    return res.status(404).json({
      error: "GitHub App not installed",
    });
  }

  const repos = installation.repositories.map((fullName) => ({
    fullName,
  }));

  res.json(repos);
});

/**
 * =====================================
 * ▶ Sync repositories from GitHub App
 * =====================================
 */
router.post("/sync-repos", async (req, res) => {
  try {
    const { installationId } = req.body;

    if (!installationId) {
      return res.status(400).json({ error: "Missing installationId" });
    }

    const repos = await fetchInstallationRepos(installationId);

    await updateInstallationRepos(
      installationId,
      repos.map((r) => r.fullName)
    );

    res.json({
      success: true,
      repositories: repos,
    });
  } catch (err) {
    console.error(
      "Repo sync failed:",
      err.response?.data || err.message
    );

    res.status(500).json({
      error: "Failed to sync repositories",
    });
  }
});

export default router;
