import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY is not set in environment variables")
  // Pad or truncate to exactly 32 bytes
  return Buffer.from(key.padEnd(KEY_LENGTH, "0").slice(0, KEY_LENGTH))
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a hex string: iv:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":")
}

/**
 * Decrypt a hex string produced by encrypt().
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Invalid ciphertext format")

  const iv = Buffer.from(parts[0], "hex")
  const tag = Buffer.from(parts[1], "hex")
  const encrypted = Buffer.from(parts[2], "hex")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8")
}

/**
 * Safely verify a Facebook webhook X-Hub-Signature-256.
 * Expected format: "sha256=<hex>"
 */
export function verifyFacebookSignature(
  body: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature.startsWith("sha256=")) return false
  const expected = createHmac("sha256", appSecret)
    .update(body, "utf8")
    .digest("hex")
  const received = signature.slice(7)
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"))
  } catch {
    return false
  }
}

/**
 * Safely decrypt a page access token from DB.
 * Returns null if token is not encrypted (mock tokens).
 */
export function safeDecrypt(token: string): string {
  if (!token || token === "mock_token") return token
  if (!token.includes(":")) return token // not encrypted
  try {
    return decrypt(token)
  } catch {
    return token // fallback
  }
}

/** Aliases used by v2 trigger engine and pages API */
export const encryptToken = encrypt
export const decryptToken = safeDecrypt
