import mongoose from "mongoose";

/* ======================================================
   🔹 Reusable Scan SubSchema
====================================================== */
const ScanSchema = new mongoose.Schema(
  {
    raw: {
      dockerfile: { type: Boolean, default: false },
      ci: { type: Boolean, default: false },
      readme: { type: Boolean, default: false },
      tests: { type: Boolean, default: false },
    },

    maturity: {
      totalScore: { type: Number, default: 0 },
      maxScore: { type: Number, default: 100 },

      categories: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    scannedAt: {
      type: Date,
    },

    branch: {
      type: String,
      default: "main",
    },
  },
  { _id: false }
);

/* ======================================================
   🔹 Repository Schema
====================================================== */
const RepositorySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      unique: true, // "owner/repo"
    },

    installationId: {
      type: Number,
      required: true,
    },

    /* ==================================================
       🔐 Encrypted Repo-Specific Secrets
    ================================================== */
    secrets: [
      {
        key: { type: String, required: true },
        encryptedValue: { type: String, required: true },
        iv: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    /* ==================================================
       📊 Production Scan (main branch)
    ================================================== */
    lastScanProduction: {
      type: ScanSchema,
      default: null,
    },

    /* ==================================================
       🎭 Demo Scan (generated branch)
    ================================================== */
    lastScanDemo: {
      type: ScanSchema,
      default: null,
    },

    /* ==================================================
       🔀 Currently Active Demo Branch
    ================================================== */
    demoBranch: {
      type: String,
      default: null,
    },

    /* ==================================================
       🗂 Backward Compatibility (Optional)
       You may remove later if unused
    ================================================== */
    lastScan: {
      type: ScanSchema,
      default: null,
    },
  },
  { timestamps: true }
);

export const RepositoryConfig = mongoose.model(
  "RepositoryConfig",
  RepositorySchema
);