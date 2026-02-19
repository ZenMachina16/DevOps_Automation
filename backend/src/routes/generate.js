import { Router } from "express";
import {
  generateGapReport,
  fetchPackageJson,
  parseGitHubUrl,
} from "../services/repoScanner.js";
import { n8nClient } from "../services/langflowClient.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { decrypt } from "../services/secretsService.js";

const router = Router();

/**
 * POST /api/generate-files
 * Triggers DevOps automation via n8n
 *
 * Expects:
 * {
 *   repoFullName: "owner/repo"
 * }
 */
import { v4 as uuidv4 } from 'uuid';
import { GenerationSession } from "../models/GenerationSession.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";

router.post("/generate-files", async (req, res) => {
  try {
    const { repoFullName } = req.body ?? {};

    if (!repoFullName || typeof repoFullName !== "string") {
      return res.status(400).json({
        error: "repoFullName is required",
      });
    }

    // 🔐 GitHub App installation REQUIRED
    const installationId = req.user?.installationId;
    if (!installationId) {
      return res.status(400).json({
        error: "GitHub App not installed for this user",
      });
    }

    // 🔁 Canonical conversion
    const repoUrl = `https://github.com/${repoFullName}.git`;
    console.log(`🚀 DevOps generation started for: ${repoUrl}`);

    /* -------------------------------------------------
       1️⃣ Parse repository URL
    -------------------------------------------------- */
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({
        error: "Invalid GitHub repository",
      });
    }

    /* -------------------------------------------------
       🆕 Create Session
    -------------------------------------------------- */
    const sessionId = uuidv4();
    const newSession = await GenerationSession.create({
      sessionId,
      repoFullName,
      status: 'GENERATING'
    });

    console.log(`✅ Created session ${sessionId} for ${repoFullName}`);

    // --- Perform heavy lifting asynchronously ---
    (async () => {
      try {
        /* -------------------------------------------------
        2️⃣ Scan repository (GitHub App aware)
        -------------------------------------------------- */
        const scanResult = await generateGapReport({
          repoUrl,
          installationId,
        });

        /* -------------------------------------------------
        3️⃣ Fetch metadata (package.json if exists)
        -------------------------------------------------- */
        const metadata = await fetchPackageJson({
          owner: parsed.owner,
          repo: parsed.repo,
          installationId,
        });

        /* -------------------------------------------------
        3.5️⃣ Fetch User Secrets (Decrypted)
        -------------------------------------------------- */
        let decryptedSecrets = {};

        // 1. Fetch Global/Installation Secrets (Optional, if you still want them as fallback)
        // ... (Skipping for now to enforce Repo-Only isolation as requested)

        // 2. Fetch Repo-Specific Secrets
        const repoConfig = await RepositoryConfig.findOne({ fullName: repoFullName });
        if (repoConfig && repoConfig.secrets) {
          repoConfig.secrets.forEach((s) => {
            try {
              const val = decrypt(s.encryptedValue, s.iv);
              if (val) decryptedSecrets[s.key] = val;
            } catch (e) {
              console.error(`Failed to decrypt repo secret ${s.key}`, e);
            }
          });
          console.log(`🔐 Injected ${Object.keys(decryptedSecrets).length} REPO-SCOPED secrets into context`);
        }

        /* -------------------------------------------------
        4️⃣ Build canonical payload for n8n
        -------------------------------------------------- */
        const payloadForN8n = {
          sessionId, // 🔑 IMPORTANT: Pass session ID to n8n
          repository: {
            owner: parsed.owner,
            name: parsed.repo,
            fullName: repoFullName,
            url: repoUrl,
            defaultBranch: "main",
          },

          project: {
            language: "JavaScript",
            manifestFilename: "package.json",
            description:
              metadata?.description ||
              `${parsed.repo} application repository`,
            dependencies: metadata?.dependencies || {},
            scripts: metadata?.scripts || {},
          },

          scan: scanResult,
          gap_report: scanResult.gapReport,
          metadata,
          secrets: decryptedSecrets
        };

        /* -------------------------------------------------
        5️⃣ Send payload to n8n DevOps workflow
        -------------------------------------------------- */
        // We do NOT await the result here because n8n will webhook back to us
        // But we DO await the initial *submission* to make sure n8n got it
        await n8nClient.generateFiles(payloadForN8n);

      } catch (bgError) {
        console.error(`❌ Background generation failed for session ${sessionId}:`, bgError);
        // Update session to failed
        await GenerationSession.updateOne({ sessionId }, { status: 'FAILED' });
      }
    })();

    /* -------------------------------------------------
       6️⃣ Return Session ID immediately
    -------------------------------------------------- */
    return res.json({
      success: true,
      sessionId,
      repoFullName,
      message: "Generation started in background",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ DevOps file generation trigger failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/generate-status
 * Checks n8n connectivity
 */
router.get("/generate-status", async (_req, res) => {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    return res.json({
      configured: Boolean(webhookUrl),
      service: "n8n",
      webhookUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      configured: false,
      error: error.message,
    });
  }
});

export default router;
