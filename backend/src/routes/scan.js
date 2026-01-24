import { Router } from "express";
import { generateGapReport } from "../services/repoScanner.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";

const router = Router();

/**
 * POST /api/scan
 * Expects:
 * {
 *   repoFullName: "owner/repo"
 * }
 */
router.post("/scan", async (req, res) => {
  try {
    const { repoFullName } = req.body ?? {};

    if (!repoFullName || typeof repoFullName !== "string") {
      return res.status(400).json({ error: "repoFullName is required" });
    }

    // 🔐 Must be logged in
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const username =
      req.user.profile?.username || req.user.profile?.login;

    // 🔍 Find installation
    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res.status(403).json({
        error: "GitHub App not installed for this user",
      });
    }

    // 🔁 Canonical conversion
    const repoUrl = `https://github.com/${repoFullName}.git`;

    const report = await generateGapReport({
      repoUrl,
      installationId: installation.installationId,
    });

    return res.json(report);
  } catch (error) {
    console.error("Scan error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
