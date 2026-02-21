import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { fetchInstallationRepos } from "../services/githubAppAuth.js";

const router = Router();

/**
 * GET /api/dashboard
 * Organization-level overview
 * Query:
 *   ?mode=production | demo
 */
router.get("/", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const mode = req.query.mode === "demo" ? "demo" : "production";

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

    // 2️⃣ Fetch repos from GitHub
    const githubRepos = await fetchInstallationRepos(
      installation.installationId
    );

    // 3️⃣ Fetch saved configs
    const savedConfigs = await RepositoryConfig.find({
      installationId: installation.installationId,
    });

    const configMap = {};
    savedConfigs.forEach((config) => {
      configMap[config.fullName] = config;
    });

    // 4️⃣ Enrich repos with selected mode scan
    const enrichedRepos = githubRepos.map((repo) => {
      const saved = configMap[repo.fullName];

      if (!saved) {
        return {
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          maturityScore: null,
          maturityLevel: "NOT_ANALYZED",
          lastScannedAt: null,
        };
      }

      const scan =
        mode === "demo"
          ? saved.lastScanDemo
          : saved.lastScanProduction;

      if (!scan?.maturity) {
        return {
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          maturityScore: null,
          maturityLevel: "NOT_ANALYZED",
          lastScannedAt: null,
        };
      }

      const score = scan.maturity.totalScore;

      let maturityLevel = "CRITICAL";
      if (score >= 80) maturityLevel = "HEALTHY";
      else if (score >= 50) maturityLevel = "NEEDS_IMPROVEMENT";

      return {
        fullName: repo.fullName,
        private: repo.private,
        defaultBranch: repo.defaultBranch,
        maturityScore: score,
        maturityLevel,
        lastScannedAt: scan.scannedAt,
      };
    });

    // 5️⃣ Calculate organization average
    const analyzedRepos = enrichedRepos.filter(
      (r) => r.maturityScore !== null
    );

    const averageMaturity =
      analyzedRepos.length === 0
        ? 0
        : Math.round(
            analyzedRepos.reduce(
              (sum, r) => sum + r.maturityScore,
              0
            ) / analyzedRepos.length
          );

    return res.json({
      totalRepositories: enrichedRepos.length,
      averageMaturity,
      repositories: enrichedRepos,
      mode,
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