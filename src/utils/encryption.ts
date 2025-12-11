import crypto from "crypto";
const ALGO = "aes-256-gcm";
const KEY_B64 = process.env.GBV_ENCRYPTION_KEY!;
function getKey(): Buffer {
  const key = Buffer.from(KEY_B64, "base64");
  return key;
}
export function encryptField(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const cipherText = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const out = Buffer.concat([iv, authTag, cipherText]).toString("base64");
  return out;
}
export function decryptField(encryptedB64: string): string {
  const key = getKey();
  const data = Buffer.from(encryptedB64, "base64");
  const iv = data.slice(0, 12);
  const authTag = data.slice(12, 28);
  const ciphertext = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
  return plaintext;
}
