import { Router } from "express";
import {
  generateGapReport,
  fetchPackageJson,
  parseGitHubUrl,
} from "../services/repoScanner.js";
import { n8nClient } from "../services/langflowClient.js";
import { GitHubInstallation } from "../models/GitHubInstallation.js";
import { decrypt } from "../utils/encryption.js"; // ✅ UPDATED
import { v4 as uuidv4 } from "uuid";
import { GenerationSession } from "../models/GenerationSession.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";
import { calculateMaturity } from "../services/maturityCalculator.js";

const router = Router();

router.post("/generate-files", async (req, res) => {
  try {
    const { repoFullName } = req.body ?? {};

    if (!repoFullName) {
      return res.status(400).json({
        success: false,
        error: "repoFullName is required",
      });
    }

    const username =
      req.user?.profile?.username ||
      req.user?.profile?.login;

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
    const repoUrl = `https://github.com/${repoFullName}.git`;
    const parsed = parseGitHubUrl(repoUrl);

    const sessionId = uuidv4();

    await GenerationSession.create({
      sessionId,
      repoFullName,
      status: "GENERATING",
    });

    (async () => {
      try {
        const scanResult = await generateGapReport({
          repoUrl,
          installationId,
          branch: "main",
        });

        const metadata = await fetchPackageJson({
          owner: parsed.owner,
          repo: parsed.repo,
          installationId,
        });

        let decryptedSecrets = {};

        const repoConfig = await RepositoryConfig.findOne({
          fullName: repoFullName,
        });

        if (repoConfig?.secrets) {
          repoConfig.secrets.forEach((s) => {
            try {
              const val = decrypt(s.encryptedValue, s.iv);
              if (val) decryptedSecrets[s.key] = val;
            } catch {}
          });
        }

        const contextForN8n = {
          repository: {
            owner: parsed.owner,
            name: parsed.repo,
            fullName: repoFullName,
            url: repoUrl,
            defaultBranch: "main",
          },
          scan: scanResult,
          metadata,
          secrets: decryptedSecrets,
        };

        const result = await n8nClient.generateFiles(
          contextForN8n,
          sessionId
        );

        const generatedBranch = result?.branchName;

        if (generatedBranch) {
          const demoRaw = await generateGapReport({
            repoUrl,
            installationId,
            branch: generatedBranch,
          });

          const demoMaturity = calculateMaturity(demoRaw);

          await RepositoryConfig.updateOne(
            { fullName: repoFullName },
            {
              $set: {
                lastScanDemo: {
                  raw: demoRaw,
                  maturity: demoMaturity,
                  scannedAt: new Date(),
                  branch: generatedBranch,
                },
                demoBranch: generatedBranch,
              },
            }
          );
        }

        await GenerationSession.updateOne(
          { sessionId },
          { status: "COMPLETED" }
        );

      } catch (err) {
        console.error("Generation background error:", err);

        await GenerationSession.updateOne(
          { sessionId },
          { status: "FAILED" }
        );
      }
    })();

    return res.json({
      success: true,
      sessionId,
      repoFullName,
    });

  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;