import mongoose from "mongoose";

const GitHubInstallationSchema = new mongoose.Schema({
  installationId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },

  accountLogin: {
    type: String,
    required: true
  },

  accountType: {
    type: String,
    enum: ["User", "Organization"],
    required: true
  },

  repositories: {
    type: [String],
    default: []
  },

  installedAt: {
    type: Date,
    default: Date.now
  },

  suspended: {
    type: Boolean,
    default: false
  },

  secrets: [
    {
      key: { type: String, required: true },
      encryptedValue: { type: String, required: true },
      iv: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now }
    }
  ]
});

export const GitHubInstallation =
  mongoose.models.GitHubInstallation ||
  mongoose.model("GitHubInstallation", GitHubInstallationSchema);
