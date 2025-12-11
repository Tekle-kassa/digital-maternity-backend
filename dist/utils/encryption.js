"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptField = encryptField;
exports.decryptField = decryptField;
const crypto_1 = __importDefault(require("crypto"));
const ALGO = "aes-256-gcm";
const KEY_B64 = process.env.GBV_ENCRYPTION_KEY;
function getKey() {
    const key = Buffer.from(KEY_B64, "base64");
    return key;
}
function encryptField(plainText) {
    const key = getKey();
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(ALGO, key, iv);
    const cipherText = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const out = Buffer.concat([iv, authTag, cipherText]).toString("base64");
    return out;
}
function decryptField(encryptedB64) {
    const key = getKey();
    const data = Buffer.from(encryptedB64, "base64");
    const iv = data.slice(0, 12);
    const authTag = data.slice(12, 28);
    const ciphertext = data.slice(28);
    const decipher = crypto_1.default.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]).toString("utf8");
    return plaintext;
}
