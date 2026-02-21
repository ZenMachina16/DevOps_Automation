import { Router } from "express";
import { generateGapReport } from "../services/repoScanner.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { calculateMaturity } from "../services/maturityCalculator.js";

const router = Router();

/**
 * POST /api/scan
 * Body:
 * {
 *   repoFullName: "owner/repo"
 * }
 */
router.post("/scan", async (req, res) => {
  try {
    const { repoFullName } = req.body ?? {};

    // ===============================
    // Validate input
    // ===============================
    if (!repoFullName || typeof repoFullName !== "string") {
      return res.status(400).json({ error: "repoFullName is required" });
    }

    // ===============================
    // Must be authenticated
    // ===============================
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const username =
      req.user.profile?.username || req.user.profile?.login;

    // ===============================
    // Validate GitHub App installation
    // ===============================
    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res.status(403).json({
        error: "GitHub App not installed for this user",
      });
    }

    // ===============================
    // Convert repoFullName → repoUrl
    // ===============================
    const repoUrl = `https://github.com/${repoFullName}.git`;

    // ===============================
    // Generate raw gap report
    // ===============================
    const rawReport = await generateGapReport({
      repoUrl,
      installationId: installation.installationId,
    });

    // rawReport example:
    // {
    //   dockerfile: true,
    //   ci: false,
    //   readme: true,
    //   tests: false
    // }

    // ===============================
    // Calculate structured maturity
    // ===============================
    const maturity = calculateMaturity(rawReport);

    // ===============================
    // Save scan result
    // ===============================
    await RepositoryConfig.findOneAndUpdate(
      { fullName: repoFullName },
      {
        $set: {
          fullName: repoFullName,
          installationId: installation.installationId,
          lastScan: {
            raw: rawReport,
            maturity,
            scannedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    // ===============================
    // Return structured maturity
    // ===============================
    return res.json(maturity);

  } catch (error) {
    console.error("Scan error:", error);
    return res.status(500).json({
      error: "Scan failed",
      details: error.message,
    });
  }
});

export default router;
