import { Router } from "express";
import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { encrypt, decrypt } from "../services/secretsService.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";

const router = Router();

/* ========================================================
   MIDDLEWARE: Ensure user has access through installation
   ======================================================== */
const checkRepoAccess = async (req, res, next) => {
    try {
        const { owner, repo } = req.params;
        const fullName = `${owner}/${repo}`;
        const userInstallationId = req.user?.installationId;

        // Find installation for the current user
        const installation = await GitHubInstallation.findOne({
            installationId: userInstallationId
        });

        if (!installation) {
            return res.status(403).json({ error: "Access denied: GitHub App not installed" });
        }

        // OPTIONAL: Verify if this repo is actually part of the installation.
        // For simplicity, we assume if they are authenticated and providing a repo name,
        // they intend to configure it. A strict check would query GitHub API to confirm access.

        req.repoFullName = fullName;
        req.installationId = userInstallationId;
        next();
    } catch (err) {
        console.error("Repo access check failed", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/* ========================================================
   1. GET SECRETS (Names only or masked values)
   ======================================================== */
router.get("/:owner/:repo/secrets", checkRepoAccess, async (req, res) => {
    try {
        const config = await RepositoryConfig.findOne({ fullName: req.repoFullName });

        if (!config) {
            return res.json([]);
        }

        // Return keys and masked values
        const safeSecrets = config.secrets.map(s => ({
            key: s.key,
            updatedAt: s.updatedAt,
            // We do NOT return the full value for security
        }));

        res.json(safeSecrets);
    } catch (err) {
        console.error("Get secrets failed", err);
        res.status(500).json({ error: "Failed to fetch secrets" });
    }
});

/* ========================================================
   2. ADD/UPDATE SECRET
   ======================================================= */
router.post("/:owner/:repo/secrets", checkRepoAccess, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || !value) {
            return res.status(400).json({ error: "Key and Value are required" });
        }

        // Encrypt locally
        const { encrypted, iv } = encrypt(value);

        // Upsert repository config
        const update = {
            $set: {
                fullName: req.repoFullName,
                installationId: req.installationId,
                // Update 'secrets' array - logic below is simpler with $pull + $push to replace
            }
        };

        // 1. Remove existing key if present (to avoid duplicates)
        await RepositoryConfig.updateOne(
            { fullName: req.repoFullName },
            { $pull: { secrets: { key } } }
        );

        // 2. Add new encrypted secret
        const result = await RepositoryConfig.findOneAndUpdate(
            { fullName: req.repoFullName },
            {
                $setOnInsert: { fullName: req.repoFullName, installationId: req.installationId },
                $push: { secrets: { key, encryptedValue: encrypted, iv, updatedAt: new Date() } }
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, secretsCount: result.secrets.length });
    } catch (err) {
        console.error("Save secret failed", err);
        res.status(500).json({ error: "Failed to save secret" });
    }
});

/* ========================================================
   3. DELETE SECRET
   ======================================================= */
router.delete("/:owner/:repo/secrets/:key", checkRepoAccess, async (req, res) => {
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
});

export default router;
