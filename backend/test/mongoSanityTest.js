import dotenv from "dotenv";
import mongoose from "mongoose";
import { GitHubInstallation } from "../src/models/GitHubInstallation.js";

// load .env
dotenv.config();

async function runTest() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "shipiq"
    });

    console.log("✅ Connected");

    // CREATE
    const created = await GitHubInstallation.create({
      installationId: 999999,
      accountLogin: "sanity-test-org",
      accountType: "Organization"
    });

    console.log("📝 Created:", created.installationId);

    // READ
    const found = await GitHubInstallation.findOne({
      installationId: 999999
    });

    console.log("🔍 Found in DB:", found.accountLogin);

    // CLEANUP (optional but recommended)
    await GitHubInstallation.deleteOne({ installationId: 999999 });
    console.log("🧹 Cleanup done");

    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  } catch (err) {
    console.error("❌ Sanity test failed:", err);
    process.exit(1);
  }
}

runTest();
