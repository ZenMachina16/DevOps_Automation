import { Router } from "express";
import {
  generateGapReport,
  fetchPackageJson,
  parseGitHubUrl,
} from "../services/repoScanner.js";
import { n8nClient } from "../services/langflowClient.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { decrypt } from "../services/secretsService.js";
import { v4 as uuidv4 } from "uuid";
import { GenerationSession } from "../models/GenerationSession.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";

const router = Router();

/**
 * POST /api/generate-files
 * Body:
 * {
 *   repoFullName: "owner/repo"
 * }
 */
router.post("/generate-files", async (req, res) => {
  try {
    const { repoFullName } = req.body ?? {};

    if (!repoFullName || typeof repoFullName !== "string") {
      return res.status(400).json({
        success: false,
        error: "repoFullName is required",
      });
    }

    /* ======================================================
       🔐 Resolve GitHub Installation (FIXED VERSION)
       ====================================================== */

    const username =
      req.user?.profile?.username ||
      req.user?.profile?.login;

    if (!username) {
      return res.status(401).json({
        success: false,
        error: "User authentication missing profile",
      });
    }

    const installation = await GitHubInstallation.findOne({
      accountLogin: username,
      suspended: false,
    });

    if (!installation) {
      return res.status(403).json({
        success: false,
        error: "GitHub App not installed for this user",
      });
    }

    const installationId = installation.installationId;

    /* ======================================================
       📦 Prepare Repo
       ====================================================== */

    const repoUrl = `https://github.com/${repoFullName}.git`;
    console.log(`🚀 DevOps generation started for: ${repoUrl}`);

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: "Invalid GitHub repository",
      });
    }

    /* ======================================================
       🆕 Create Session
       ====================================================== */

    const sessionId = uuidv4();

    await GenerationSession.create({
      sessionId,
      repoFullName,
      status: "GENERATING",
    });

    console.log(`✅ Created session ${sessionId}`);

    /* ======================================================
       🔁 Background Processing
       ====================================================== */

    (async () => {
      try {
        /* 1️⃣ Scan Repository */
        const scanResult = await generateGapReport({
          repoUrl,
          installationId,
        });

        /* 2️⃣ Fetch Metadata */
        const metadata = await fetchPackageJson({
          owner: parsed.owner,
          repo: parsed.repo,
          installationId,
        });

        /* 3️⃣ Load & Decrypt Repo Secrets */
        let decryptedSecrets = {};

        const repoConfig = await RepositoryConfig.findOne({
          fullName: repoFullName,
        });

        if (repoConfig?.secrets) {
          repoConfig.secrets.forEach((s) => {
            try {
              const val = decrypt(s.encryptedValue, s.iv);
              if (val) decryptedSecrets[s.key] = val;
            } catch (e) {
              console.error(`Secret decrypt failed: ${s.key}`);
            }
          });
        }

        /* 4️⃣ Build Payload */
        const payloadForN8n = {
          sessionId,
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
          gap_report: scanResult?.gapReport,
          metadata,
          secrets: decryptedSecrets,
        };

        /* 5️⃣ Send to n8n */
        await n8nClient.generateFiles(payloadForN8n);

      } catch (bgError) {
        console.error("❌ Background generation failed:", bgError);

        await GenerationSession.updateOne(
          { sessionId },
          { status: "FAILED" }
        );
      }
    })();

    /* ======================================================
       🚀 Immediate Response
       ====================================================== */

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