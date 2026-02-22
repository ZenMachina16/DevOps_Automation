import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-cbc";
const ENCODING = "hex";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

// Get key and ensure it is Buffer
const getKey = () => {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error("ENCRYPTION_KEY is not defined in .env");
    }
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== KEY_LENGTH) {
        throw new Error(`ENCRYPTION_KEY must be 32 bytes (64 hex characters). Current length: ${key.length}`);
    }
    return key;
};

/**
 * Encrypts a string value
 * @param {string} text - Plain text to encrypt
 * @returns {object} { encryptedValue: string, iv: string }
 */
export function encrypt(text) {
    if (typeof text !== "string") {
        throw new Error("Value to encrypt must be a string");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", ENCODING);
    encrypted += cipher.final(ENCODING);

    return {
        encryptedValue: encrypted,
        iv: iv.toString(ENCODING)
    };
}

/**
 * Decrypts a value
 * @param {string} encryptedValue - The encrypted hex string
 * @param {string} ivHex - The initialization vector hex string
 * @returns {string} The decrypted plain text
 */
export function decrypt(encryptedValue, ivHex) {
    if (!encryptedValue || !ivHex) return null;

    const iv = Buffer.from(ivHex, ENCODING);
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedValue, ENCODING, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
