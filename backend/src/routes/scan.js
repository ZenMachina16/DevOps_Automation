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
 *   repoFullName: "owner/repo",
 *   branch?: "main",
 *   mode?: "production" | "demo"
 * }
 */
router.post("/scan", async (req, res) => {
  try {
    const {
      repoFullName,
      branch = "main",
      mode = "production",
    } = req.body ?? {};

    if (!repoFullName || typeof repoFullName !== "string") {
      return res.status(400).json({ error: "repoFullName is required" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const username =
      req.user.profile?.username || req.user.profile?.login;

    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res.status(403).json({
        error: "GitHub App not installed for this user",
      });
    }

    const repoUrl = `https://github.com/${repoFullName}.git`;

    // 🔍 Run scan
    const rawReport = await generateGapReport({
      repoUrl,
      installationId: installation.installationId,
      branch,
    });

    const maturity = calculateMaturity(rawReport);

    const scanData = {
      raw: rawReport,
      maturity,
      scannedAt: new Date(),
      branch,
    };

    // 🔥 Maintain backward compatibility with lastScan
    const updateFields =
      mode === "demo"
        ? {
            lastScanDemo: scanData,
            demoBranch: branch,
            lastScan: scanData, // 🔥 compatibility layer
          }
        : {
            lastScanProduction: scanData,
            lastScan: scanData, // 🔥 compatibility layer
          };

    await RepositoryConfig.findOneAndUpdate(
      { fullName: repoFullName },
      {
        $set: {
          fullName: repoFullName,
          installationId: installation.installationId,
          ...updateFields,
        },
      },
      { upsert: true, new: true }
    );

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