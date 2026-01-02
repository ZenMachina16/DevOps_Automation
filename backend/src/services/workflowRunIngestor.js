// backend/src/services/workflowRunIngestor.js

import { classifyRun } from "./runClassifier.js";

/**
 * Map GitHub step names → ShipIQ stages
 * MUST match workflow step names exactly
 */
const STEP_TO_STAGE = {
  "Verify package.json exists": "VERIFY_PACKAGE",
  "Validate environment variable injection": "ENV_CHECK",
  "Install dependencies": "INSTALL_DEPS",
  "Run tests (non-blocking)": "TEST",
  "Build Docker image": "DOCKER_BUILD",
  "Run Docker container (platform smoke test)": "DOCKER_RUN",
  "Wait for startup window": "STARTUP_WAIT",
  "Verify container is running": "VERIFY_RUNNING",
  "Detect fatal startup errors (log inference)": "LOG_SCAN"
};

/* =====================================================
   LIVE STAGE — workflow_job.in_progress
   ===================================================== */
export function getLiveStageFromJob({ job }) {
  if (!job?.steps?.length) {
    return "INITIALIZING";
  }

  const activeStep =
    job.steps.find(s => s.status === "in_progress") ||
    job.steps.find(s => s.status === "queued");

  if (!activeStep) {
    return "FINALIZING";
  }

  return STEP_TO_STAGE[activeStep.name] || "UNKNOWN";
}

/* =====================================================
   FINAL CLASSIFICATION — workflow_job.completed
   ===================================================== */
export function ingestCompletedWorkflowJob({ job }) {
  const failedStep = job.steps?.find(
    step => step.conclusion === "failure"
  );

  const failedStage = failedStep
    ? STEP_TO_STAGE[failedStep.name] || "UNKNOWN"
    : "UNKNOWN";

  return classifyRun({
    jobStatus: job.conclusion,
    failedStage
  });
}
