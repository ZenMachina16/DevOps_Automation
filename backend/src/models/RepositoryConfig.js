import mongoose from "mongoose";

const RepositorySchema = new mongoose.Schema({
    fullName: { type: String, required: true, unique: true }, // "owner/repo"
    installationId: { type: Number, required: true },

    // Encrypted secrets specific to this repo
    secrets: [
        {
            key: { type: String, required: true },
            encryptedValue: { type: String, required: true },
            iv: { type: String, required: true },
            updatedAt: { type: Date, default: Date.now }
        }
    ],

    // Store last scan results here for quick access
    lastScan: {
        dockerfile: Boolean,
        ci: Boolean,
        readme: Boolean,
        tests: Boolean,
        scannedAt: Date
    }
}, { timestamps: true });

export const RepositoryConfig = mongoose.model("RepositoryConfig", RepositorySchema);
