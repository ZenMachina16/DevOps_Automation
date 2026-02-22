import { Router } from "express";
import { provisionRepoSecrets } from "../services/environmentProvisionService.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";

const router = Router();

/**
 * POST /api/environment/provision
 * Now provisions repository-level secrets only
 */
router.post("/provision", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { repoFullName } = req.body;

    if (!repoFullName) {
      return res.status(400).json({ error: "repoFullName required" });
    }

    const username =
      req.user.profile?.username || req.user.profile?.login;

    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res.status(403).json({
        error: "GitHub App not installed",
      });
    }

    const [owner, repo] = repoFullName.split("/");

    const result = await provisionRepoSecrets({
      installationId: installation.installationId,
      owner,
      repo,
      secrets: [
        { key: "SHIPIQ_TEST", value: "working123" },
      ],
    });

    return res.json(result);

  } catch (error) {
    console.error("Repo secret provision error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

export default router;