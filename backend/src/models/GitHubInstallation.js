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
  }
});

export const GitHubInstallation =
  mongoose.models.GitHubInstallation ||
  mongoose.model("GitHubInstallation", GitHubInstallationSchema);
