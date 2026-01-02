import { classifyRun } from "./runClassifier.js";

const logs = `
SHIPIQ_STAGE=VERIFY_PACKAGE
SHIPIQ_STAGE=ENV_CHECK
❌ Missing env var: FIREBASE_API_KEY
`;

const result = classifyRun({
  jobStatus: "failure",
  logs,
  scanEnvVars: ["FIREBASE_API_KEY", "FIREBASE_DATABASE_URL"]
});

console.log("Classification result:");
console.log(JSON.stringify(result, null, 2));
