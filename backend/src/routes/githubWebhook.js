// backend/src/routes/githubWebhook.js

import { Router } from "express";
import axios from "axios";
import {
  getLiveStageFromJob,
  ingestCompletedWorkflowJob
} from "../services/workflowRunIngestor.js";
import { GenerationSession } from "../models/GenerationSession.js";
import {
  addRepositories,
  removeRepositories
} from "../services/installationService.js";

const router = Router();

/* =====================================================
   MAIN WEBHOOK ENDPOINT
   ===================================================== */
router.post("/webhook", async (req, res) => {
  try {
    const eventType = req.headers["x-github-event"];
    const { action } = req.body;
    const installationId = req.body.installation?.id;

    console.log("🔔 GitHub Webhook Received");
    console.log("Event:", eventType);
    console.log("Action:", action);
    console.log("Installation ID:", installationId);
    console.log(`GitHub webhook received: ${eventType} - ${action}`);

    // Access socket.io instance
    const io = req.app.get("io");

    /* =================================================
       PULL REQUEST (OPENED/MERGED)
       ================================================= */
    if (eventType === "pull_request") {
      const pr = req.body.pull_request;
      const repo = req.body.repository;

      if (action === "opened") {
        console.log(`🚀 PR Opened: ${pr.html_url}`);

        // Find active session for this repo
        const session = await GenerationSession.findOne({
          repoFullName: repo.full_name
          // Potentially filter by status != 'COMPLETED'
        }).sort({ createdAt: -1 });

        if (session) {
          session.status = "PR_OPEN";
          session.prUrl = pr.html_url;
          await session.save();
          console.log(`✅ Linked PR to session ${session.sessionId}`);
        }
      }

      if (action === "closed" && pr.merged) {
        console.log(`🚀 PR Merged: ${pr.html_url}`);

        // Find active session
        const session = await GenerationSession.findOne({
          repoFullName: repo.full_name,
          status: "PR_OPEN"
        }).sort({ createdAt: -1 });

        if (session) {
          session.status = "PR_MERGED";
          await session.save();
          console.log(`✅ Session ${session.sessionId} marked as PR_MERGED`);
        }
      }
    }


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

      // Find active session
      const session = await GenerationSession.findOne({
        repoFullName: repo.full_name
      }).sort({ createdAt: -1 });

      if (session) {
        // Only update if we are past the PR stage
        if (["PR_MERGED", "PR_OPEN", "CODE_CREATED"].includes(session.status)) {
          session.status = "CI_RUNNING";
          session.ciStatus = stage;
          await session.save();
        }
      }

      // 🔥 Emit live stage update
      if (io) {
        io.to(repo.full_name).emit("ciUpdate", {
          repo: repo.full_name,
          status: "in_progress",
          stage,
          type: "RUNNING",
          retryable: false,
          confidence: 1,
          updatedAt: new Date()
        });
      }
    }

    /* =================================================
       REPO SELECTION CHANGED (installation_repositories)
       ================================================= */
    if (eventType === "installation_repositories") {
      const { repositories_added, repositories_removed } = req.body;

      if (action === "added" && repositories_added?.length > 0) {
        const addedNames = repositories_added.map((r) => r.full_name);
        await addRepositories(installationId, addedNames);
        console.log(`➕ Repos added: ${addedNames.join(", ")}`);
      }

      if (action === "removed" && repositories_removed?.length > 0) {
        const removedNames = repositories_removed.map((r) => r.full_name);
        await removeRepositories(installationId, removedNames);
        console.log(`➖ Repos removed: ${removedNames.join(", ")}`);
      }
    }

    /* =================================================
       FINAL CLASSIFICATION (workflow_job.completed)
       ================================================= */
    if (eventType === "workflow_job" && action === "completed") {
      await handleWorkflowJobCompletion(
        req,
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
async function handleWorkflowJobCompletion(req, job, repository) {
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

  const io = req.app.get("io");

  // 🔥 Emit final classification update
  if (io) {
    io.to(repository.full_name).emit("ciUpdate", {
      repo: repository.full_name,
      status: classification.status, // success or failure
      stage: classification.stage,
      type: classification.type,
      retryable: classification.retryable,
      confidence: classification.confidence,
      updatedAt: new Date()
    });
  }

  // Update Session
  const session = await GenerationSession.findOne({
    repoFullName: repository.full_name
  }).sort({ createdAt: -1 });

  if (session) {
    if (job.conclusion === "success") {
      session.status = "COMPLETED";
    } else if (job.conclusion === "failure" && !classification.retryable) {
      session.status = "FAILED"; // Or keep running if other jobs are pending?
    }
    session.ciStatus = classification.status;
    await session.save();
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
    websocketEnabled: true,
    webhookUrl: "/api/github/webhook",
    supportedEvents: ["workflow_job", "pull_request"],
    timestamp: new Date().toISOString()
  });
});

export default router;
