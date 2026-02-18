import { Router } from "express";
import { GenerationSession } from "../models/GenerationSession.js";

const router = Router();

// Mounted at /api

/**
 * GET /api/session/:sessionId
 * Fetch session status and generated files
 */
router.get("/session/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await GenerationSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        return res.json(session);
    } catch (error) {
        console.error("Session fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch session" });
    }
});

/**
 * POST /api/webhooks/n8n/generation-complete
 * Webhook for n8n to report generated files
 */
router.post("/webhooks/n8n/generation-complete", async (req, res) => {
    try {
        const { sessionId, generatedFiles, branchName } = req.body;

        console.log(`📥 Received n8n completion for session ${sessionId}`);

        if (!sessionId) {
            return res.status(400).json({ error: "Missing sessionId" });
        }

        const session = await GenerationSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Update session
        session.status = "CODE_CREATED";
        session.generatedFiles = generatedFiles || {};
        if (branchName) session.branchName = branchName;

        // If n8n created the PR directly, we might get prUrl here too
        if (req.body.prUrl) session.prUrl = req.body.prUrl;
        if (req.body.status) session.status = req.body.status; // Allow override if n8n sends status like "PR_OPEN"

        await session.save();

        console.log(`✅ Session ${sessionId} updated with generated files`);

        return res.json({ success: true });
    } catch (error) {
        console.error("n8n webhook error:", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
});

export default router;
