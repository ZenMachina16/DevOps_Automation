// backend/src/services/runClassifier.js

/**
 * Classify a GitHub Actions workflow failure
 * based on deterministic CI stage
 */
export function classifyRun({ jobStatus, failedStage }) {
  // Success
  if (jobStatus === "success") {
    return {
      status: "success",
      type: "SUCCESS",
      stage: "COMPLETED",
      retryable: false,
      confidence: 1.0
    };
  }

  switch (failedStage) {
    case "ENV_CHECK":
      return {
        status: "failure",
        type: "ENV_NOT_CONFIGURED",
        stage: failedStage,
        retryable: false,
        confidence: 0.95
      };

    case "INSTALL_DEPS":
      return {
        status: "failure",
        type: "DEPENDENCY_INSTALL_ERROR",
        stage: failedStage,
        retryable: true,
        confidence: 0.9
      };

    case "TEST":
      return {
        status: "failure",
        type: "TEST_FAILURE",
        stage: failedStage,
        retryable: true,
        confidence: 0.85
      };

    case "DOCKER_BUILD":
      return {
        status: "failure",
        type: "DOCKER_BUILD_ERROR",
        stage: failedStage,
        retryable: false,
        confidence: 0.9
      };

    case "DOCKER_RUN":
    case "VERIFY_RUNNING":
      return {
        status: "failure",
        type: "CONTAINER_BOOT_ERROR",
        stage: failedStage,
        retryable: false,
        confidence: 0.85
      };

    case "LOG_SCAN":
      return {
        status: "failure",
        type: "RUNTIME_FATAL",
        stage: failedStage,
        retryable: false,
        confidence: 0.9
      };

    default:
      return {
        status: "failure",
        type: "UNKNOWN_FAILURE",
        stage: failedStage ?? "UNKNOWN",
        retryable: false,
        confidence: 0.4
      };
  }
}
