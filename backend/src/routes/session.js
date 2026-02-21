import { Router } from "express";
import { GenerationSession } from "../models/GenerationSession.js";
import { RepositoryConfig } from "../models/RepositoryConfig.js";

const router = Router();

/* ============================================================
   GET SESSION STATUS
============================================================ */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GenerationSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json(session);
  } catch (error) {
    console.error("❌ Session fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

/* ============================================================
   🔥 N8N GENERATION COMPLETE WEBHOOK
============================================================ */
router.post("/webhooks/n8n/generation-complete", async (req, res) => {
  try {
    const {
      sessionId,
      generatedFiles,
      branchName,
      prUrl,
      status,
    } = req.body;

    console.log("📥 n8n webhook received");
    console.log("Payload:", req.body);

    /* ===============================
       VALIDATION
    =============================== */
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const session = await GenerationSession.findOne({ sessionId });

    if (!session) {
      console.error("❌ Session not found:", sessionId);
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.repoFullName) {
      console.error("❌ Session missing repoFullName");
      return res.status(400).json({
        error: "Session missing repository reference",
      });
    }

    console.log("📦 Repository:", session.repoFullName);

    /* ===============================
       UPDATE GENERATION SESSION
    =============================== */

    session.status = status || "CODE_CREATED";
    session.generatedFiles = generatedFiles || session.generatedFiles;

    if (branchName) {
      session.branchName = branchName;
    }

    if (prUrl) {
      session.prUrl = prUrl;
    }

    await session.save();

    console.log(`✅ Session ${sessionId} updated`);

    /* ===============================
       🔥 SAVE DEMO BRANCH SAFELY
    =============================== */

    if (branchName) {
      const repo = await RepositoryConfig.findOne({
        fullName: session.repoFullName,
      });

      if (!repo) {
        console.error(
          "❌ RepositoryConfig not found for:",
          session.repoFullName
        );
        return res.status(404).json({
          error: "Repository configuration not found",
        });
      }

      repo.demoBranch = branchName;
      await repo.save();

      console.log(
        `📌 Demo branch "${branchName}" saved for ${session.repoFullName}`
      );
    }

    return res.json({ success: true });

  } catch (error) {
    console.error("❌ n8n webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;