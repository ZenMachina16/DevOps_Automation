import mongoose from "mongoose";

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

    // 🔐 Encrypted secrets specific to this repo
    secrets: [
      {
        key: { type: String, required: true },
        encryptedValue: { type: String, required: true },
        iv: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // 📊 Structured scan result
    lastScan: {
      raw: {
        dockerfile: { type: Boolean, default: false },
        ci: { type: Boolean, default: false },
        readme: { type: Boolean, default: false },
        tests: { type: Boolean, default: false },
      },

      maturity: {
        totalScore: { type: Number, default: 0 },
        maxScore: { type: Number, default: 100 },

        // Flexible nested structure
        categories: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },

      scannedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

export const RepositoryConfig = mongoose.model(
  "RepositoryConfig",
  RepositorySchema
);
