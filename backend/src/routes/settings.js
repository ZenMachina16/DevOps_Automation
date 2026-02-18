import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { encrypt } from "../services/secretsService.js";

const router = Router();

/**
 * Middleware: Ensure installation exists for user
 */
const requireInstallation = async (req, res, next) => {
    if (!req.user?.installationId) {
        return res.status(401).json({ error: "No GitHub App installation found" });
    }
    next();
};

/**
 * GET /api/settings/secrets
 * Returns list of secrets (MASKED)
 */
router.get("/secrets", requireInstallation, async (req, res) => {
    try {
        const { installationId } = req.user;

        // Use findOne directly to get the document
        const installation = await GitHubInstallation.findOne({ installationId });

        if (!installation) {
            return res.status(404).json({ error: "Installation not found" });
        }

        // Return masked secrets
        const secrets = (installation.secrets || []).map(s => ({
            key: s.key,
            maskedValue: "••••••••••••••••", // Never return real value
            updatedAt: s.updatedAt
        }));

        res.json(secrets);
    } catch (err) {
        console.error("Failed to fetch secrets:", err);
        res.status(500).json({ error: "Failed to fetch secrets" });
    }
});

/**
 * POST /api/settings/secrets
 * Add or Update a secret
 */
router.post("/secrets", requireInstallation, async (req, res) => {
    try {
        const { installationId } = req.user;
        const { key, value } = req.body;

        if (!key || !value) {
            return res.status(400).json({ error: "Key and value are required" });
        }

        // 1. Encrypt
        const { encryptedValue, iv } = encrypt(value);

        // 2. Atomic Update (Remove old if exists, then push new)
        // This allows overwrite behavior
        await GitHubInstallation.findOneAndUpdate(
            { installationId },
            { $pull: { secrets: { key } } } // Remove if exists
        );

        const updated = await GitHubInstallation.findOneAndUpdate(
            { installationId },
            {
                $push: {
                    secrets: {
                        key,
                        encryptedValue,
                        iv,
                        updatedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            secret: {
                key,
                maskedValue: "••••••••••••••••",
                updatedAt: new Date()
            }
        });

    } catch (err) {
        console.error("Failed to save secret:", err);
        res.status(500).json({ error: "Failed to save secret" });
    }
});

/**
 * DELETE /api/settings/secrets/:key
 * Remove a secret
 */
router.delete("/secrets/:key", requireInstallation, async (req, res) => {
    try {
        const { installationId } = req.user;
        const { key } = req.params;

        await GitHubInstallation.findOneAndUpdate(
            { installationId },
            { $pull: { secrets: { key } } }
        );

        res.json({ success: true, key });
    } catch (err) {
        console.error("Failed to delete secret:", err);
        res.status(500).json({ error: "Failed to delete secret" });
    }
});

export default router;
