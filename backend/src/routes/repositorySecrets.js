import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import {
  saveRepositorySecret,
  syncMongoSecretsToGitHub,
} from "../services/repositorySecretService.js";

const router = Router();

/**
 * Save Secret (store encrypted in Mongo)
 */
router.post("/save", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { repoFullName, key, value } = req.body;

    if (!repoFullName || !key || !value) {
      return res.status(400).json({
        error: "repoFullName, key, value required",
      });
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

    await saveRepositorySecret({
      fullName: repoFullName,
      installationId: installation.installationId,
      key,
      value,
    });

    return res.json({ success: true });

  } catch (error) {
    console.error("Secret save error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Push Mongo secrets → GitHub repo
 */
router.post("/sync", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { repoFullName } = req.body;

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

    const result = await syncMongoSecretsToGitHub({
      fullName: repoFullName,
      installationId: installation.installationId,
    });

    return res.json(result);

  } catch (error) {
    console.error("Secret sync error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;