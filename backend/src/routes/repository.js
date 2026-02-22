import { Router } from "express";
import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { encrypt } from "../utils/encryption.js"; // ✅ UPDATED
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { GenerationSession } from "../models/GenerationSession.js";

const router = Router();

/* ========================================================
   MIDDLEWARE: Ensure user has access through installation
======================================================== */
const checkRepoAccess = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;

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

    req.repoFullName = fullName;
    req.installationId = installation.installationId;

    next();
  } catch (err) {
    console.error("Repo access check failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ========================================================
   1️⃣ GET REPO DETAILS
======================================================== */
router.get("/:owner/:repo", checkRepoAccess, async (req, res) => {
  try {
    const config = await RepositoryConfig.findOne({
      fullName: req.repoFullName,
    });

    const activeSession = await GenerationSession.findOne({
      repoFullName: req.repoFullName,
      status: { $nin: ["COMPLETED", "FAILED"] },
    }).sort({ createdAt: -1 });

    const secrets =
      config?.secrets?.map((s) => ({
        key: s.key,
        updatedAt: s.updatedAt,
      })) || [];

    res.json({
      fullName: req.repoFullName,
      demoBranch: config?.demoBranch || null,
      lastScanProduction: config?.lastScanProduction || null,
      lastScanDemo: config?.lastScanDemo || null,
      lastScan:
        config?.lastScanProduction ||
        config?.lastScan ||
        null,
      secrets,
      activeSession: activeSession
        ? {
            sessionId: activeSession.sessionId,
            status: activeSession.status,
            createdAt: activeSession.createdAt,
            prUrl: activeSession.prUrl || null,
          }
        : null,
    });
  } catch (err) {
    console.error("Get repo details failed", err);
    res.status(500).json({
      error: "Failed to fetch repository details",
    });
  }
});

/* ========================================================
   2️⃣ GET SECRETS
======================================================== */
router.get("/:owner/:repo/secrets", checkRepoAccess, async (req, res) => {
  try {
    const config = await RepositoryConfig.findOne({
      fullName: req.repoFullName,
    });

    if (!config) {
      return res.json([]);
    }

    const safeSecrets = config.secrets.map((s) => ({
      key: s.key,
      updatedAt: s.updatedAt,
    }));

    res.json(safeSecrets);
  } catch (err) {
    console.error("Get secrets failed", err);
    res.status(500).json({ error: "Failed to fetch secrets" });
  }
});

/* ========================================================
   3️⃣ ADD/UPDATE SECRET
======================================================== */
router.post("/:owner/:repo/secrets", checkRepoAccess, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res
        .status(400)
        .json({ error: "Key and value are required" });
    }

    const { encryptedValue, iv } = encrypt(value); // ✅ FIXED

    await RepositoryConfig.updateOne(
      { fullName: req.repoFullName },
      { $pull: { secrets: { key } } }
    );

    const result = await RepositoryConfig.findOneAndUpdate(
      { fullName: req.repoFullName },
      {
        $setOnInsert: {
          fullName: req.repoFullName,
          installationId: req.installationId,
        },
        $push: {
          secrets: {
            key,
            encryptedValue,
            iv,
            updatedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      secretsCount: result.secrets.length,
    });
  } catch (err) {
    console.error("Save secret failed", err);
    res.status(500).json({ error: "Failed to save secret" });
  }
});

/* ========================================================
   4️⃣ DELETE SECRET
======================================================== */
router.delete(
  "/:owner/:repo/secrets/:key",
  checkRepoAccess,
  async (req, res) => {
    try {
      const { key } = req.params;

      await RepositoryConfig.updateOne(
        { fullName: req.repoFullName },
        { $pull: { secrets: { key } } }
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Delete secret failed", err);
      res.status(500).json({ error: "Failed to delete secret" });
    }
  }
);

export default router;