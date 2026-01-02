// backend/src/routes/githubWebhook.js

import { Router } from "express";
import axios from "axios";
import {
  getLiveStageFromJob,
  ingestCompletedWorkflowJob
} from "../services/workflowRunIngestor.js";

const router = Router();

/* =====================================================
   MAIN WEBHOOK ENDPOINT
   ===================================================== */
router.post("/webhook", async (req, res) => {
  try {
    const eventType = req.headers["x-github-event"];
    const { action } = req.body;

    console.log(`GitHub webhook received: ${eventType} - ${action}`);

    /* =================================================
       LIVE CI STAGE (workflow_job.in_progress)
       ================================================= */
    if (eventType === "workflow_job" && action === "in_progress") {
      const job = req.body.workflow_job;
      const repo = req.body.repository;

      const stage = getLiveStageFromJob({ job });

      console.log(
        `🔄 LIVE CI STAGE | ${repo.full_name} | ${stage}`
      );
    }

    /* =================================================
       FINAL CLASSIFICATION (workflow_job.completed)
       ================================================= */
    if (eventType === "workflow_job" && action === "completed") {
      await handleWorkflowJobCompletion(
        req.body.workflow_job,
        req.body.repository
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook failure" });
  }
});

/* =====================================================
   FINAL JOB COMPLETION HANDLER
   ===================================================== */
async function handleWorkflowJobCompletion(job, repository) {
  console.log(
    `Workflow job completed for ${repository.full_name}: ${job.conclusion}`
  );

  let classification;

  try {
    classification = ingestCompletedWorkflowJob({ job });

    console.log("🧠 ShipIQ classification:", classification);
  } catch (err) {
    console.error("Classification failed:", err.message);
    return;
  }

  // Retry ONLY if classifier allows it
  if (job.conclusion === "failure" && classification.retryable) {
    await triggerRetryWorkflow(repository, job, classification);
  }

  if (job.conclusion === "success") {
    console.log(`✅ CI job successful for ${repository.full_name}`);
  }
}

/* =====================================================
   RETRY VIA N8N (CLASSIFIER-DRIVEN)
   ===================================================== */
async function triggerRetryWorkflow(repository, job, classification) {
  try {
    await axios.post(process.env.N8N_RETRY_WEBHOOK_URL, {
      repository: {
        owner: repository.owner.login,
        name: repository.name,
        fullName: repository.full_name
      },
      job: {
        id: job.id,
        name: job.name,
        conclusion: job.conclusion
      },
      classification,
      trigger: "classifier_retry",
      triggeredAt: new Date().toISOString()
    });

    console.log("🔁 Retry triggered via n8n");
  } catch (err) {
    console.error("Retry trigger failed:", err.message);
  }
}

/* =====================================================
   HEALTH CHECK
   ===================================================== */
router.get("/webhook/status", (req, res) => {
  res.json({
    configured: true,
    webhookUrl: "/api/github/webhook",
    supportedEvents: ["workflow_job"],
    timestamp: new Date().toISOString()
  });
});

export default router;
