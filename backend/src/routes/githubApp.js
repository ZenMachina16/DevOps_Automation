import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { getInstallationDetails } from "../services/githubAppAuth.js";

const router = Router();

/**
 * ===============================
 * STEP 1: Redirect to GitHub App install
 * ===============================
 */
router.get("/install", (req, res) => {
  if (!process.env.GITHUB_APP_SLUG) {
    return res.status(500).json({
      error: "GITHUB_APP_SLUG not configured"
    });
  }

  const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`;
  return res.redirect(installUrl);
});

/**
 * ===============================
 * STEP 2: Link installation to DB
 * (called from /setup frontend)
 * ===============================
 */
router.post("/link-installation", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { installationId } = req.body;

    if (!installationId) {
      return res.status(400).json({ error: "installationId is required" });
    }

    // 🔑 Fetch installation info from GitHub as App
    const details = await getInstallationDetails(installationId);

    const installation = await GitHubInstallation.findOneAndUpdate(
      { installationId },
      {
        installationId,
        accountLogin: details.account.login,
        accountType: details.account.type,
        suspended: false,
        installedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      installation
    });
  } catch (err) {
    console.error("❌ Failed to link installation:", err);
    return res.status(500).json({
      error: "Failed to link GitHub App installation"
    });
  }
});

export default router;
