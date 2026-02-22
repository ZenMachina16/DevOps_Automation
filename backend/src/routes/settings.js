import { Router } from "express";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { encrypt } from "../utils/encryption.js"; // ✅ FIXED

const router = Router();

/**
 * Middleware: Ensure GitHub App installation exists for user
 */
const requireInstallation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const username =
      req.user.profile?.username ||
      req.user.profile?.login;

    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res
        .status(403)
        .json({ error: "GitHub App not installed" });
    }

    req.installation = installation;
    next();
  } catch (err) {
    console.error("Installation check failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/settings/secrets
 * Returns masked secrets
 */
router.get("/secrets", requireInstallation, async (req, res) => {
  try {
    const installation = req.installation;

    const secrets = (installation.secrets || []).map((s) => ({
      key: s.key,
      maskedValue: "••••••••••••••••",
      updatedAt: s.updatedAt,
    }));

    res.json(secrets);
  } catch (err) {
    console.error("Failed to fetch secrets:", err);
    res.status(500).json({ error: "Failed to fetch secrets" });
  }
});

/**
 * POST /api/settings/secrets
 * Add or update installation-level secret
 */
router.post("/secrets", requireInstallation, async (req, res) => {
  try {
    const installation = req.installation;
    const { key, value } = req.body;

    if (!key || !value) {
      return res
        .status(400)
        .json({ error: "Key and value are required" });
    }

    const { encryptedValue, iv } = encrypt(value);

    // Remove old version if exists
    await GitHubInstallation.updateOne(
      { installationId: installation.installationId },
      { $pull: { secrets: { key } } }
    );

    // Push new encrypted secret
    await GitHubInstallation.updateOne(
      { installationId: installation.installationId },
      {
        $push: {
          secrets: {
            key,
            encryptedValue,
            iv,
            updatedAt: new Date(),
          },
        },
      }
    );

    res.json({
      success: true,
      secret: {
        key,
        maskedValue: "••••••••••••••••",
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("Failed to save secret:", err);
    res.status(500).json({ error: "Failed to save secret" });
  }
});

/**
 * DELETE /api/settings/secrets/:key
 */
router.delete("/secrets/:key", requireInstallation, async (req, res) => {
  try {
    const installation = req.installation;
    const { key } = req.params;

    await GitHubInstallation.updateOne(
      { installationId: installation.installationId },
      { $pull: { secrets: { key } } }
    );

    res.json({ success: true, key });
  } catch (err) {
    console.error("Failed to delete secret:", err);
    res.status(500).json({ error: "Failed to delete secret" });
  }
});

export default router;