import { Router } from "express";
import {
  generateGapReport,
  fetchPackageJson,
  parseGitHubUrl,
} from "../services/repoScanner.js";
import { n8nClient } from "../services/langflowClient.js";

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
       2️⃣ Scan repository (GitHub App aware)
    -------------------------------------------------- */
    const scanResult = await generateGapReport({
      repoUrl,
      installationId,
    });

    console.log("🔍 Scan result:", scanResult);

    /* -------------------------------------------------
       3️⃣ Fetch metadata (package.json if exists)
    -------------------------------------------------- */
    const metadata = await fetchPackageJson({
      owner: parsed.owner,
      repo: parsed.repo,
      installationId,
    });

    console.log("📦 Repository metadata:", metadata);

    /* -------------------------------------------------
       4️⃣ Build canonical payload for n8n
    -------------------------------------------------- */
    const payloadForN8n = {
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
    };

    /* -------------------------------------------------
       5️⃣ Send payload to n8n DevOps workflow
    -------------------------------------------------- */
    const generatedFiles =
      await n8nClient.generateFiles(payloadForN8n);

    /* -------------------------------------------------
       6️⃣ Return response
    -------------------------------------------------- */
    return res.json({
      success: true,
      repository: payloadForN8n.repository,
      scan: scanResult,
      generatedFiles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ DevOps file generation failed:", error);

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
