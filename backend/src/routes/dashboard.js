import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { fetchInstallationRepos } from "../services/githubAppAuth.js";

const router = Router();

/**
 * GET /api/dashboard
 * Organization-level overview
 */
router.get("/", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const username =
      req.user.profile?.username || req.user.profile?.login;

    // 1️⃣ Get installation
    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res.status(403).json({
        error: "GitHub App not installed",
      });
    }

    // 2️⃣ Fetch repos from GitHub using YOUR existing service
    const githubRepos = await fetchInstallationRepos(
      installation.installationId
    );

    // 3️⃣ Fetch saved scan configs
    const savedConfigs = await RepositoryConfig.find({
      installationId: installation.installationId,
    });

    const configMap = {};
    savedConfigs.forEach((config) => {
      configMap[config.fullName] = config;
    });

    // 4️⃣ Enrich repos with maturity
    const enrichedRepos = githubRepos.map((repo) => {
      const saved = configMap[repo.fullName];

      if (!saved || !saved.lastScan?.maturity) {
        return {
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          maturityScore: null,
          maturityLevel: "NOT_ANALYZED",
          lastScannedAt: null,
        };
      }

      const score = saved.lastScan.maturity.totalScore;

      let maturityLevel = "CRITICAL";
      if (score >= 80) maturityLevel = "HEALTHY";
      else if (score >= 50) maturityLevel = "NEEDS_IMPROVEMENT";

      return {
        fullName: repo.fullName,
        private: repo.private,
        defaultBranch: repo.defaultBranch,
        maturityScore: score,
        maturityLevel,
        lastScannedAt: saved.lastScan.scannedAt,
      };
    });

    return res.json({
      totalRepositories: enrichedRepos.length,
      repositories: enrichedRepos,
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({
      error: "Failed to load dashboard",
      details: err.message,
    });
  }
});

export default router;
